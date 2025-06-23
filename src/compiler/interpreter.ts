import type { IRInstruction, Program } from './types';

type RuntimeValue = number | string;

export class Interpreter {
    private ir: IRInstruction[] = [];
    private functions = new Map<string, { startIndex: number, paramNames: string[] }>();
    private output: RuntimeValue[] = [];

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
        this.output = []; // Reset for each run
        if (!this.functions.has(entryPoint)) {
            return "Execution Error: 'main' function not found.";
        }
        try {
            const returnValue = this.runFunction(entryPoint, []);
            if (this.output.length > 0) {
                return this.output.join('\n');
            }
            return returnValue;
        } catch (e: any) {
            return `Execution Error: ${e.message}`;
        }
    }

    private runFunction(funcName: string, args: RuntimeValue[]): RuntimeValue {
        const funcInfo = this.functions.get(funcName);
        if (!funcInfo) {
            throw new Error(`Function '${funcName}' is not defined.`);
        }

        const memory = new Map<string, RuntimeValue>();
        // Set parameters in the function's memory scope
        funcInfo.paramNames.forEach((name, i) => {
            memory.set(name, args[i]);
        });

        const getValue = (operand: string | number | undefined): RuntimeValue => {
            if (typeof operand === 'number') return operand;
            if (typeof operand === 'string') {
                 // It could be a variable name or a string literal from the IR
                return memory.get(operand) ?? operand;
            }
            throw new Error("Invalid operand");
        };
        const setValue = (dest: string | number | undefined, val: RuntimeValue) => {
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
                case 'ADD':
                    const add1 = getValue(arg1);
                    const add2 = getValue(arg2);
                     // string concat or number addition
                    setValue(dest, (add1 as any) + (add2 as any));
                    break;
                case 'SUB': setValue(dest, (getValue(arg1) as number) - (getValue(arg2) as number)); break;
                case 'MUL': setValue(dest, (getValue(arg1) as number) * (getValue(arg2) as number)); break;
                case 'DIV':
                    const divisor = getValue(arg2) as number;
                    if (divisor === 0) throw new Error("Division by zero");
                    setValue(dest, Math.trunc((getValue(arg1) as number) / divisor));
                    break;
                case 'MOD':
                    const modDivisor = getValue(arg2) as number;
                    if (modDivisor === 0) throw new Error("Division by zero");
                    setValue(dest, (getValue(arg1) as number) % modDivisor);
                    break;
                case 'CMP_EQ': setValue(dest, getValue(arg1) === getValue(arg2) ? 1 : 0); break;
                case 'CMP_NE': setValue(dest, getValue(arg1) !== getValue(arg2) ? 1 : 0); break;
                case 'CMP_LT': setValue(dest, (getValue(arg1) as number) < (getValue(arg2) as number) ? 1 : 0); break;
                case 'CMP_GT': setValue(dest, (getValue(arg1) as number) > (getValue(arg2) as number) ? 1 : 0); break;
                case 'CMP_LE': setValue(dest, (getValue(arg1) as number) <= (getValue(arg2) as number) ? 1 : 0); break;
                case 'CMP_GE': setValue(dest, (getValue(arg1) as number) >= (getValue(arg2) as number) ? 1 : 0); break;

                case 'JUMP':
                    ip = this.ir.findIndex(i => i.op === 'LABEL' && i.dest === dest);
                    continue;
                case 'JUMP_IF_ZERO':
                    if (getValue(arg1) === 0) {
                        ip = this.ir.findIndex(i => i.op === 'LABEL' && i.dest === dest);
                        continue;
                    }
                    break;
                
                case 'PRINT':
                    this.output.push(getValue(arg1));
                    break;

                case 'RETURN':
                    return getValue(arg1);

                case 'CALL':
                    const callArgs: RuntimeValue[] = [];
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
