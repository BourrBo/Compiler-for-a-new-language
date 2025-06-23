import { TokenType, Token } from "./types";
import type { 
    Program, FunctionNode, Parameter, Block, Statement, VarDeclaration, Assignment, ReturnStatement, IfStatement, WhileStatement,
    ExpressionStatement, Expression, BinaryOp, UnaryOp, NumberLiteral, Identifier, FunctionCall
} from "./types";

export class Parser {
    private pos = 0;

    constructor(private tokens: Token[]) {}

    private currentToken(): Token {
        return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1];
    }
    
    private peekToken(): Token {
        return this.tokens[this.pos + 1] ?? this.tokens[this.tokens.length - 1];
    }
    
    private advance() {
        if (this.pos < this.tokens.length - 1) this.pos++;
    }

    private expect(tokenType: TokenType): Token {
        const token = this.currentToken();
        if (token.type !== tokenType) {
            throw new Error(`Expected ${tokenType}, got ${token.type} at line ${token.line}`);
        }
        this.advance();
        return token;
    }

    private consumeOptionalSemicolon() {
        if (this.currentToken().type === TokenType.SEMICOLON) {
            this.advance();
        }
    }

    public parse(): Program {
        const functions: FunctionNode[] = [];
        while (this.currentToken().type !== TokenType.EOF) {
            functions.push(this.parseFunction());
        }
        return { nodeType: 'Program', functions };
    }

    private parseFunction(): FunctionNode {
        this.expect(TokenType.FUNC);
        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.LPAREN);
        const params: Parameter[] = [];
        if (this.currentToken().type !== TokenType.RPAREN) {
            params.push(this.parseParameter());
            while (this.currentToken().type === TokenType.COMMA) {
                this.advance();
                params.push(this.parseParameter());
            }
        }
        this.expect(TokenType.RPAREN);
        const body = this.parseBlock();
        return { nodeType: 'Function', name, params, body };
    }

    private parseParameter(): Parameter {
        const name = this.expect(TokenType.IDENTIFIER).value;
        return { nodeType: 'Parameter', name };
    }

    private parseBlock(): Block {
        this.expect(TokenType.LBRACE);
        const statements: Statement[] = [];
        while (this.currentToken().type !== TokenType.RBRACE && this.currentToken().type !== TokenType.EOF) {
            statements.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE);
        return { nodeType: 'Block', statements };
    }

    private parseStatement(): Statement {
        const token = this.currentToken();
        if (token.type === TokenType.LET) return this.parseVarDeclaration();
        if (token.type === TokenType.RETURN) return this.parseReturnStatement();
        if (token.type === TokenType.IF) return this.parseIfStatement();
        if (token.type === TokenType.WHILE) return this.parseWhileStatement();
        if (token.type === TokenType.LBRACE) return this.parseBlock();

        // Distinguish between assignment and expression statement
        if (token.type === TokenType.IDENTIFIER && this.peekToken().type === TokenType.ASSIGN) {
            return this.parseAssignment();
        }
        
        const expression = this.parseExpression();
        this.consumeOptionalSemicolon();
        return { nodeType: 'ExpressionStatement', expression };
    }

    private parseVarDeclaration(): VarDeclaration {
        this.expect(TokenType.LET);
        const name = this.expect(TokenType.IDENTIFIER).value;
        let initializer: Expression | undefined = undefined;
        if (this.currentToken().type === TokenType.ASSIGN) {
            this.advance();
            initializer = this.parseExpression();
        }
        this.consumeOptionalSemicolon();
        return { nodeType: 'VarDeclaration', name, initializer };
    }

    private parseAssignment(): Assignment {
        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.ASSIGN);
        const value = this.parseExpression();
        this.consumeOptionalSemicolon();
        return { nodeType: 'Assignment', name, value };
    }

    private parseReturnStatement(): ReturnStatement {
        this.expect(TokenType.RETURN);
        let value: Expression | undefined = undefined;
        if (this.currentToken().type !== TokenType.SEMICOLON && this.currentToken().type !== TokenType.RBRACE) {
            value = this.parseExpression();
        }
        this.consumeOptionalSemicolon();
        return { nodeType: 'ReturnStatement', value };
    }

    private parseIfStatement(): IfStatement {
        this.expect(TokenType.IF);
        this.expect(TokenType.LPAREN);
        const condition = this.parseExpression();
        this.expect(TokenType.RPAREN);
        const thenStmt = this.parseStatement();
        let elseStmt: Statement | undefined = undefined;
        if (this.currentToken().type === TokenType.ELSE) {
            this.advance();
            elseStmt = this.parseStatement();
        }
        return { nodeType: 'IfStatement', condition, thenStmt, elseStmt };
    }
    
    private parseWhileStatement(): WhileStatement {
        this.expect(TokenType.WHILE);
        this.expect(TokenType.LPAREN);
        const condition = this.parseExpression();
        this.expect(TokenType.RPAREN);
        const body = this.parseStatement();
        return { nodeType: 'WhileStatement', condition, body };
    }

    private parseExpression(): Expression {
        return this.parseComparison();
    }

    private parseComparison(): Expression {
        let expr = this.parseTerm();
        while ([TokenType.EQUAL, TokenType.NOT_EQUAL, TokenType.LESS_THAN, TokenType.GREATER_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL].includes(this.currentToken().type)) {
            const operator = this.currentToken().value;
            this.advance();
            const right = this.parseTerm();
            expr = { nodeType: 'BinaryOp', left: expr, operator, right };
        }
        return expr;
    }

    private parseTerm(): Expression {
        let expr = this.parseFactor();
        while ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken().type)) {
            const operator = this.currentToken().value;
            this.advance();
            const right = this.parseFactor();
            expr = { nodeType: 'BinaryOp', left: expr, operator, right };
        }
        return expr;
    }

    private parseFactor(): Expression {
        let expr = this.parseUnary();
        while ([TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO].includes(this.currentToken().type)) {
            const operator = this.currentToken().value;
            this.advance();
            const right = this.parseUnary();
            expr = { nodeType: 'BinaryOp', left: expr, operator, right };
        }
        return expr;
    }

    private parseUnary(): Expression {
        if ([TokenType.MINUS, TokenType.PLUS].includes(this.currentToken().type)) {
            const operator = this.currentToken().value;
            this.advance();
            const operand = this.parseUnary();
            return { nodeType: 'UnaryOp', operator, operand };
        }
        return this.parsePrimary();
    }

    private parsePrimary(): Expression {
        const token = this.currentToken();
        if (token.type === TokenType.NUMBER) {
            this.advance();
            return { nodeType: 'Number', value: parseInt(token.value, 10) };
        }
        if (token.type === TokenType.IDENTIFIER) {
            const name = token.value;
            this.advance();
            if (this.currentToken().type === TokenType.LPAREN) {
                this.advance();
                const args: Expression[] = [];
                if (this.currentToken().type !== TokenType.RPAREN) {
                    args.push(this.parseExpression());
                    while (this.currentToken().type === TokenType.COMMA) {
                        this.advance();
                        args.push(this.parseExpression());
                    }
                }
                this.expect(TokenType.RPAREN);
                return { nodeType: 'FunctionCall', name, args };
            }
            return { nodeType: 'Identifier', name };
        }
        if (token.type === TokenType.LPAREN) {
            this.advance();
            const expr = this.parseExpression();
            this.expect(TokenType.RPAREN);
            return expr;
        }
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
}
