import type {
    Program, FunctionNode, Block, Statement, Expression, VarDeclaration, Assignment,
    Identifier, FunctionCall, ASTNode, ReturnStatement, IfStatement, WhileStatement,
    BinaryOp, UnaryOp, NumberLiteral, ExpressionStatement, Parameter, IRInstruction,
    PrintStatement, StringLiteral
} from './types';

export class IRGenerator {
    private ir: IRInstruction[] = [];
    private tempCounter = 0;
    private labelCounter = 0;
    private stringLiterals = new Map<string, string>();

    private newTemp(): string {
        return `t${this.tempCounter++}`;
    }

    private newLabel(prefix: string = 'L'): string {
        return `${prefix}${this.labelCounter++}`;
    }

    public generate(program: Program): IRInstruction[] {
        this.ir = [];
        for (const func of program.functions) {
            this.visitFunction(func);
        }
        // Could add string data section here if targeting assembly more directly
        return this.ir;
    }

    private emit(instr: IRInstruction) {
        this.ir.push(instr);
    }

    private visitFunction(node: FunctionNode) {
        this.emit({ op: 'LABEL', dest: node.name });
        this.emit({ op: 'PROLOGUE' });
        node.params.forEach((param, i) => {
            this.emit({ op: 'STORE', dest: param.name, arg1: i }); // Placeholder for param passing
        });
        this.visitBlock(node.body);
        // Check if the last instruction is a return, if not, add one.
        if (this.ir.length === 0 || this.ir[this.ir.length - 1].op !== 'RETURN') {
            this.emit({ op: 'RETURN', arg1: 0 }); // Default return
        }
        this.emit({ op: 'EPILOGUE' });
    }

    private visitBlock(node: Block) {
        for (const stmt of node.statements) {
            this.visitStatement(stmt);
        }
    }

    private visitStatement(node: Statement) {
        switch (node.nodeType) {
            case 'VarDeclaration': this.visitVarDeclaration(node); break;
            case 'Assignment': this.visitAssignment(node); break;
            case 'ReturnStatement': this.visitReturnStatement(node); break;
            case 'IfStatement': this.visitIfStatement(node); break;
            case 'WhileStatement': this.visitWhileStatement(node); break;
            case 'ExpressionStatement': this.visitExpression(node.expression); break;
            case 'PrintStatement': this.visitPrintStatement(node); break;
            case 'Block': this.visitBlock(node); break;
        }
    }

    private visitPrintStatement(node: PrintStatement) {
        const valueReg = this.visitExpression(node.expression);
        this.emit({ op: 'PRINT', arg1: valueReg });
    }

    private visitVarDeclaration(node: VarDeclaration) {
        this.emit({ op: 'ALLOC', dest: node.name });
        if (node.initializer) {
            const valueReg = this.visitExpression(node.initializer);
            this.emit({ op: 'STORE', dest: node.name, arg1: valueReg });
        }
    }

    private visitAssignment(node: Assignment) {
        const valueReg = this.visitExpression(node.value);
        this.emit({ op: 'STORE', dest: node.name, arg1: valueReg });
    }

    private visitReturnStatement(node: ReturnStatement) {
        if (node.value) {
            const returnReg = this.visitExpression(node.value);
            this.emit({ op: 'RETURN', arg1: returnReg });
        } else {
            this.emit({ op: 'RETURN', arg1: 0 });
        }
    }

    private visitIfStatement(node: IfStatement) {
        const elseLabel = this.newLabel('if_else');
        const endLabel = this.newLabel('if_end');
        
        const condReg = this.visitExpression(node.condition);
        this.emit({ op: 'JUMP_IF_ZERO', dest: elseLabel, arg1: condReg });

        this.visitStatement(node.thenStmt);
        this.emit({ op: 'JUMP', dest: endLabel });

        this.emit({ op: 'LABEL', dest: elseLabel });
        if (node.elseStmt) {
            this.visitStatement(node.elseStmt);
        }
        
        this.emit({ op: 'LABEL', dest: endLabel });
    }

    private visitWhileStatement(node: WhileStatement) {
        const startLabel = this.newLabel('while_start');
        const endLabel = this.newLabel('while_end');

        this.emit({ op: 'LABEL', dest: startLabel });
        const condReg = this.visitExpression(node.condition);
        this.emit({ op: 'JUMP_IF_ZERO', dest: endLabel, arg1: condReg });
        
        this.visitStatement(node.body);
        this.emit({ op: 'JUMP', dest: startLabel });

        this.emit({ op: 'LABEL', dest: endLabel });
    }

    private visitExpression(node: Expression): string {
        switch (node.nodeType) {
            case 'Number': return this.visitNumber(node);
            case 'StringLiteral': return this.visitStringLiteral(node);
            case 'Identifier': return this.visitIdentifier(node);
            case 'BinaryOp': return this.visitBinaryOp(node);
            case 'UnaryOp': return this.visitUnaryOp(node);
            case 'FunctionCall': return this.visitFunctionCall(node);
        }
    }

    private visitNumber(node: NumberLiteral): string {
        const temp = this.newTemp();
        this.emit({ op: 'LOAD', dest: temp, arg1: node.value });
        return temp;
    }
    
    private visitStringLiteral(node: StringLiteral): string {
        const temp = this.newTemp();
        this.emit({ op: 'LOAD', dest: temp, arg1: node.value });
        return temp;
    }

    private visitIdentifier(node: Identifier): string {
        const temp = this.newTemp();
        this.emit({ op: 'LOAD', dest: temp, arg1: node.name });
        return temp;
    }

    private visitBinaryOp(node: BinaryOp): string {
        const leftReg = this.visitExpression(node.left);
        const rightReg = this.visitExpression(node.right);
        const destReg = this.newTemp();
        
        // Basic type checking for string concatenation
        if (node.operator === '+') {
            // Simplified: This IR doesn't have type info. A real implementation would.
            // We assume if either operand is a string, it's concatenation.
            this.emit({ op: 'ADD', dest: destReg, arg1: leftReg, arg2: rightReg });
            return destReg;
        }

        const opMap = {
            '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD',
            '==': 'CMP_EQ', '!=': 'CMP_NE', '<': 'CMP_LT', '>': 'CMP_GT', '<=': 'CMP_LE', '>=': 'CMP_GE'
        };

        const irOp = opMap[node.operator as keyof typeof opMap];
        if(irOp) {
            this.emit({ op: irOp as any, dest: destReg, arg1: leftReg, arg2: rightReg });
        }
        return destReg;
    }

    private visitUnaryOp(node: UnaryOp): string {
        const operandReg = this.visitExpression(node.operand);
        const destReg = this.newTemp();
        if (node.operator === '-') {
            const zeroTemp = this.newTemp();
            this.emit({ op: 'LOAD', dest: zeroTemp, arg1: 0 });
            this.emit({ op: 'SUB', dest: destReg, arg1: zeroTemp, arg2: operandReg });
        } else {
            // Unary plus is a no-op, just move the value
            this.emit({ op: 'LOAD', dest: destReg, arg1: operandReg });
        }
        return destReg;
    }

    private visitFunctionCall(node: FunctionCall): string {
        const argRegs = node.args.map(arg => this.visitExpression(arg));
        argRegs.forEach(reg => {
            this.emit({ op: 'PARAM', arg1: reg });
        });
        const destReg = this.newTemp();
        this.emit({ op: 'CALL', dest: destReg, arg1: node.name, arg2: node.args.length });
        return destReg;
    }
}
