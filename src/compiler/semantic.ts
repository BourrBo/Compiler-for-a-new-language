import type {
    Program, FunctionNode, Block, Statement, Expression, VarDeclaration, Assignment,
    Identifier, FunctionCall, ASTNode, ReturnStatement, IfStatement, WhileStatement,
    BinaryOp, UnaryOp, NumberLiteral, ExpressionStatement, Parameter
} from './types';

type SymbolType = 'variable' | 'function';
interface Symbol {
    type: SymbolType;
    dataType: string;
    paramTypes?: string[];
}

class SymbolTable {
    private scopes: Map<string, Symbol>[] = [new Map()];

    enterScope() {
        this.scopes.push(new Map());
    }

    exitScope() {
        this.scopes.pop();
    }

    declare(name: string, symbol: Symbol) {
        if (this.scopes[this.scopes.length - 1].has(name)) {
            return `Symbol '${name}' already declared in this scope.`;
        }
        this.scopes[this.scopes.length - 1].set(name, symbol);
        return null;
    }

    lookup(name: string): Symbol | null {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                return this.scopes[i].get(name)!;
            }
        }
        return null;
    }
}

export class SemanticAnalyzer {
    private symbolTable = new SymbolTable();
    private errors: string[] = [];
    private currentFunction: FunctionNode | null = null;

    public analyze(program: Program) {
        this.visitProgram(program);
        return { errors: this.errors };
    }

    private error(message: string) {
        this.errors.push(message);
    }

    private visitProgram(node: Program) {
        // First pass: declare all functions in global scope
        for (const func of node.functions) {
            const error = this.symbolTable.declare(func.name, {
                type: 'function',
                dataType: func.returnType,
                paramTypes: func.params.map(p => p.paramType),
            });
            if (error) this.error(error);
        }

        // Second pass: visit each function body
        for (const func of node.functions) {
            this.visitFunction(func);
        }
    }

    private visitFunction(node: FunctionNode) {
        this.currentFunction = node;
        this.symbolTable.enterScope();
        for (const param of node.params) {
            this.visitParameter(param);
        }
        this.visitBlock(node.body);
        this.symbolTable.exitScope();
        this.currentFunction = null;
    }

    private visitParameter(node: Parameter) {
        const error = this.symbolTable.declare(node.name, { type: 'variable', dataType: node.paramType });
        if (error) this.error(error);
    }

    private visitBlock(node: Block) {
        this.symbolTable.enterScope();
        for (const stmt of node.statements) {
            this.visitStatement(stmt);
        }
        this.symbolTable.exitScope();
    }

    private visitStatement(node: Statement) {
        switch (node.nodeType) {
            case 'VarDeclaration': return this.visitVarDeclaration(node);
            case 'Assignment': return this.visitAssignment(node);
            case 'ReturnStatement': return this.visitReturnStatement(node);
            case 'IfStatement': return this.visitIfStatement(node);
            case 'WhileStatement': return this.visitWhileStatement(node);
            case 'ExpressionStatement': return this.visitExpressionStatement(node);
            case 'Block': return this.visitBlock(node);
        }
    }

    private visitVarDeclaration(node: VarDeclaration) {
        if (node.initializer) {
            this.visitExpression(node.initializer);
        }
        const error = this.symbolTable.declare(node.name, { type: 'variable', dataType: node.varType });
        if(error) this.error(error);
    }

    private visitAssignment(node: Assignment) {
        const symbol = this.symbolTable.lookup(node.name);
        if (!symbol) {
            this.error(`Variable '${node.name}' not declared.`);
        } else if (symbol.type !== 'variable') {
            this.error(`'${node.name}' is not a variable.`);
        }
        this.visitExpression(node.value);
    }

    private visitReturnStatement(node: ReturnStatement) {
        if (!this.currentFunction) {
            this.error("Return statement outside of a function.");
            return;
        }
        if (node.value) {
            this.visitExpression(node.value);
        }
    }
    
    private visitIfStatement(node: IfStatement) {
        this.visitExpression(node.condition);
        this.visitStatement(node.thenStmt);
        if (node.elseStmt) {
            this.visitStatement(node.elseStmt);
        }
    }

    private visitWhileStatement(node: WhileStatement) {
        this.visitExpression(node.condition);
        this.visitStatement(node.body);
    }

    private visitExpressionStatement(node: ExpressionStatement) {
        this.visitExpression(node.expression);
    }

    private visitExpression(node: Expression) {
        switch (node.nodeType) {
            case 'Identifier': return this.visitIdentifier(node);
            case 'FunctionCall': return this.visitFunctionCall(node);
            case 'BinaryOp': return this.visitBinaryOp(node);
            case 'UnaryOp': return this.visitUnaryOp(node);
            case 'Number': return; // No check needed
        }
    }

    private visitIdentifier(node: Identifier) {
        const symbol = this.symbolTable.lookup(node.name);
        if (!symbol) {
            this.error(`Variable '${node.name}' not declared.`);
        } else if (symbol.type !== 'variable') {
            this.error(`'${node.name}' is not a variable.`);
        }
    }
    
    private visitFunctionCall(node: FunctionCall) {
        const symbol = this.symbolTable.lookup(node.name);
        if (!symbol) {
            this.error(`Function '${node.name}' not declared.`);
            return;
        }
        if (symbol.type !== 'function') {
            this.error(`'${node.name}' is not a function.`);
            return;
        }
        if (symbol.paramTypes!.length !== node.args.length) {
            this.error(`Function '${node.name}' expects ${symbol.paramTypes!.length} arguments, but got ${node.args.length}.`);
        }
        for(const arg of node.args) {
            this.visitExpression(arg);
        }
    }

    private visitBinaryOp(node: BinaryOp) {
        this.visitExpression(node.left);
        this.visitExpression(node.right);
    }

    private visitUnaryOp(node: UnaryOp) {
        this.visitExpression(node.operand);
    }
}
