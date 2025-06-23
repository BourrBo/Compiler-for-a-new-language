import type { IRInstruction, Program } from './types';

export class Interpreter {
    private ir: IRInstruction[] = [];
    private functions = new Map<string, { startIndex: number, paramNames: string[] }>();

    constructor(private ast: Program, ir: IRInstruction[]) {
        this.ir = ir;
        // Pre-process to find function start indices and parameter names from the AST
        ast.functions.forEach(funcNode => {
            const funcLabelIndex = ir.findIndex(i => i.op === 'LABEL' && i.dest === funcNode.name);
            if (funcLabelIndex !== -1) {
                this.functions.set(funcNode.name, {
                    startIndex: funcLabelIndex,
                    paramNames: funcNode.params.map(p => p.name)
                });
            }
        });
    }

    public run(entryPoint: string = 'main'): number | string {
        if (!this.functions.has(entryPoint)) {
            return "Execution Error: 'main' function not found.";
        }
        try {
            return this.runFunction(entryPoint, []);
        } catch (e: any) {
            return `Execution Error: ${e.message}`;
        }
    }

    private runFunction(funcName: string, args: number[]): number {
        const funcInfo = this.functions.get(funcName);
        if (!funcInfo) {
            throw new Error(`Function '${funcName}' is not defined.`);
        }

        const memory = new Map<string, number>();
        // Set parameters in the function's memory scope
        funcInfo.paramNames.forEach((name, i) => {
            memory.set(name, args[i]);
        });

        const getValue = (operand: string | number | undefined): number => {
            if (typeof operand === 'number') return operand;
            if (typeof operand === 'string') return memory.get(operand) ?? 0;
            throw new Error("Invalid operand");
        };
        const setValue = (dest: string | number | undefined, val: number) => {
            if (typeof dest === 'string') memory.set(dest, val);
        };

        let ip = funcInfo.startIndex;
        while (ip < this.ir.length) {
            const instr = this.ir[ip];
            const { op, dest, arg1, arg2 } = instr;

            // Stop execution if we hit the end of the current function's IR block.
            if (op === 'EPILOGUE') break;

            switch(op) {
                case 'ALLOC': setValue(dest, 0); break;
                case 'STORE': setValue(dest, getValue(arg1)); break;
                case 'LOAD': setValue(dest, getValue(arg1)); break;
                case 'ADD': setValue(dest, getValue(arg1) + getValue(arg2)); break;
                case 'SUB': setValue(dest, getValue(arg1) - getValue(arg2)); break;
                case 'MUL': setValue(dest, getValue(arg1) * getValue(arg2)); break;
                case 'DIV':
                    const divisor = getValue(arg2);
                    if (divisor === 0) throw new Error("Division by zero");
                    setValue(dest, Math.trunc(getValue(arg1) / divisor));
                    break;
                case 'CMP_EQ': setValue(dest, getValue(arg1) === getValue(arg2) ? 1 : 0); break;
                case 'CMP_NE': setValue(dest, getValue(arg1) !== getValue(arg2) ? 1 : 0); break;
                case 'CMP_LT': setValue(dest, getValue(arg1) < getValue(arg2) ? 1 : 0); break;
                case 'CMP_GT': setValue(dest, getValue(arg1) > getValue(arg2) ? 1 : 0); break;
                case 'CMP_LE': setValue(dest, getValue(arg1) <= getValue(arg2) ? 1 : 0); break;
                case 'CMP_GE': setValue(dest, getValue(arg1) >= getValue(arg2) ? 1 : 0); break;

                case 'JUMP':
                    ip = this.ir.findIndex(i => i.op === 'LABEL' && i.dest === dest);
                    continue;
                case 'JUMP_IF_ZERO':
                    if (getValue(arg1) === 0) {
                        ip = this.ir.findIndex(i => i.op === 'LABEL' && i.dest === dest);
                        continue;
                    }
                    break;

                case 'RETURN':
                    return getValue(arg1);

                case 'CALL':
                    const callArgs: number[] = [];
                    let paramLookbehind = 1;
                    // Find PARAM instructions before the CALL to gather arguments
                    while (this.ir[ip - paramLookbehind]?.op === 'PARAM') {
                        callArgs.unshift(getValue(this.ir[ip - paramLookbehind].arg1));
                        paramLookbehind++;
                    }
                    const callResult = this.runFunction(arg1 as string, callArgs);
                    setValue(dest, callResult);
                    break;
                
                case 'PARAM':
                case 'LABEL':
                case 'PROLOGUE':
                    // These are handled by the call/jump logic or are no-ops for interpretation
                    break;
            }
            ip++;
        }
        return 0; // Default return if no explicit return statement is hit
    }
}
