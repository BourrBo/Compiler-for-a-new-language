import type { Program, IRInstruction, FunctionNode } from './types';

export class AssemblyGenerator {
    private code: string[] = [];
    private labelCounter = 0;
    private currentFunctionName: string | null = null;
    private varMap: Map<string, number> = new Map(); // var name -> stack offset
    private stackOffset = 0;
    private paramRegs = ["%rdi", "%rsi", "%rdx", "%rcx", "%r8", "%r9"];

    private emit(instruction: string) {
        this.code.push(instruction);
    }

    private newAsmLabel(prefix: string = "L"): string {
        return `.${prefix}${this.currentFunctionName}${this.labelCounter++}`;
    }

    private getVarOffset(varName: string): number {
        if (!this.varMap.has(varName)) {
           this.stackOffset += 8;
           this.varMap.set(varName, -this.stackOffset);
        }
        return this.varMap.get(varName)!;
    }

    public generate(ast: Program, ir: IRInstruction[]): string {
        this.code = [];
        this.emit(".section .text");
        this.emit(".globl main"); // Assume main is the entry point
        this.emit("");
        
        // This is a simplified approach. A better one would analyze IR per function.
        // We'll find function boundaries by 'PROLOGUE' ops and AST info.
        let irIndex = 0;
        for (const func of ast.functions) {
            this.currentFunctionName = func.name;
            this.labelCounter = 0;
            this.stackOffset = 0;
            this.varMap.clear();

            // Find start of function in IR
            while(irIndex < ir.length && (ir[irIndex].op !== 'PROLOGUE' || ir[irIndex-1].dest !== func.name)) {
                irIndex++;
            }

            this.emit(`${func.name}:`);
            this.emit("    push %rbp");
            this.emit("    mov %rsp, %rbp");

            // Allocate space for local variables (crude way)
            const localVars = this.countLocalVars(func);
            this.emit(`    sub $${localVars * 8}, %rsp`);

            // Assign parameter offsets
            func.params.forEach((param, i) => {
                const offset = this.getVarOffset(param.name);
                this.emit(`    mov ${this.paramRegs[i]}, ${offset}(%rbp)`);
            });
            
            // Process function body from IR
            while (irIndex < ir.length && ir[irIndex].op !== 'EPILOGUE') {
                this.generateInstruction(ir[irIndex]);
                irIndex++;
            }
        }

        return this.code.join('\n');
    }

    private countLocalVars(func: FunctionNode): number {
        let count = 0;
        const visitor = (node: any) => {
            if (node.nodeType === 'VarDeclaration') count++;
            for(const key in node) {
                if(typeof node[key] === 'object' && node[key] !== null) {
                    if(Array.isArray(node[key])) {
                        node[key].forEach(visitor);
                    } else {
                        visitor(node[key]);
                    }
                }
            }
        };
        visitor(func.body);
        return count;
    }

    private generateInstruction(instr: IRInstruction) {
        const { op, dest, arg1, arg2 } = instr;
        const destOffset = typeof dest === 'string' ? `${this.getVarOffset(dest)}(%rbp)` : '';

        switch (op) {
            case 'ALLOC':
                this.getVarOffset(dest as string); // ensures space is tracked
                break;
            case 'STORE':
                this.emit(`    mov ${arg1}, ${destOffset}`);
                break;
            case 'LOAD':
                if (typeof arg1 === 'number') {
                    this.emit(`    mov $${arg1}, ${destOffset}`);
                } else {
                    this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                    this.emit(`    mov %rax, ${destOffset}`);
                }
                break;
            case 'ADD':
            case 'SUB':
            case 'MUL':
                const arithOp = op === 'ADD' ? 'add' : op === 'SUB' ? 'sub' : 'imul';
                this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                this.emit(`    mov ${this.getVarOffset(arg2 as string)}(%rbp), %rbx`);
                this.emit(`    ${arithOp} %rbx, %rax`);
                this.emit(`    mov %rax, ${destOffset}`);
                break;
            case 'DIV':
                this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                this.emit(`    cqo`); // sign extend
                this.emit(`    idiv ${this.getVarOffset(arg2 as string)}(%rbp)`);
                this.emit(`    mov %rax, ${destOffset}`);
                break;
            case 'LABEL':
                this.emit(`${dest}:`);
                break;
            case 'JUMP':
                this.emit(`    jmp ${dest}`);
                break;
            case 'JUMP_IF_ZERO':
                this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                this.emit(`    cmp $0, %rax`);
                this.emit(`    je ${dest}`);
                break;
            case 'RETURN':
                if (typeof arg1 === 'string') {
                    this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                } else {
                    this.emit(`    mov $${arg1}, %rax`);
                }
                this.emit(`    mov %rbp, %rsp`);
                this.emit(`    pop %rbp`);
                this.emit(`    ret`);
                break;
            case 'CALL':
                // setup params before call
                const callLabel = arg1;
                const numArgs = arg2 as number;
                // This is simplified; assumes params are already in registers from PARAM ops
                this.emit(`    call ${callLabel}`);
                this.emit(`    mov %rax, ${destOffset}`);
                break;
            
            case 'PARAM':
                // Simplified: this logic should be more complex, moving params to registers
                // For now, we assume parameters are handled correctly before the call.
                // For example, finding the last N PARAM instructions before a CALL.
                break;

            case 'CMP_EQ':
            case 'CMP_NE':
            case 'CMP_LT':
            case 'CMP_GT':
            case 'CMP_LE':
            case 'CMP_GE':
                const setInstruction = {
                    'CMP_EQ': 'sete', 'CMP_NE': 'setne', 'CMP_LT': 'setl', 
                    'CMP_GT': 'setg', 'CMP_LE': 'setle', 'CMP_GE': 'setge'
                }[op];
                this.emit(`    mov ${this.getVarOffset(arg1 as string)}(%rbp), %rax`);
                this.emit(`    cmp ${this.getVarOffset(arg2 as string)}(%rbp), %rax`);
                this.emit(`    ${setInstruction} %al`);
                this.emit(`    movzbl %al, %eax`);
                this.emit(`    mov %rax, ${destOffset}`);
                break;
        }
    }
}
