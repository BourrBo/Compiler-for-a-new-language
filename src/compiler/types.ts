// =============================================================================
// TOKEN TYPES
// =============================================================================

export enum TokenType {
    // Literals
    NUMBER = "NUMBER",
    IDENTIFIER = "IDENTIFIER",
    STRING = "STRING",
    
    // Keywords
    LET = "let",
    FUNC = "func",
    RETURN = "return",
    IF = "if",
    ELSE = "else",
    WHILE = "while",
    PRINT = "print",
    
    // Operators
    PLUS = "+",
    MINUS = "-",
    MULTIPLY = "*",
    DIVIDE = "/",
    MODULO = "%",
    ASSIGN = "=",
    EQUAL = "==",
    NOT_EQUAL = "!=",
    LESS_THAN = "<",
    GREATER_THAN = ">",
    LESS_EQUAL = "<=",
    GREATER_EQUAL = ">=",
    
    // Delimiters
    SEMICOLON = ";",
    COMMA = ",",
    LPAREN = "(",
    RPAREN = ")",
    LBRACE = "{",
    RBRACE = "}",
    
    // Special
    EOF = "EOF",
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}


// =============================================================================
// AST NODE TYPES
// =============================================================================

export type ASTNode = Program | FunctionNode | Parameter | Block | Statement | Expression;

export type NodeTypes = 
    'Program' | 'Function' | 'Parameter' | 'Block' | 
    'VarDeclaration' | 'Assignment' | 'ReturnStatement' | 'IfStatement' | 'WhileStatement' | 'ExpressionStatement' |
    'PrintStatement' |
    'BinaryOp' | 'UnaryOp' | 'Number' | 'Identifier' | 'StringLiteral' | 'FunctionCall';

interface BaseNode {
    nodeType: NodeTypes;
}

export interface Program extends BaseNode {
    nodeType: 'Program';
    functions: FunctionNode[];
}

export interface FunctionNode extends BaseNode {
    nodeType: 'Function';
    name: string;
    params: Parameter[];
    body: Block;
}

export interface Parameter extends BaseNode {
    nodeType: 'Parameter';
    name: string;
}

export interface Block extends BaseNode {
    nodeType: 'Block';
    statements: Statement[];
}

export type Statement = VarDeclaration | Assignment | ReturnStatement | IfStatement | WhileStatement | ExpressionStatement | Block | PrintStatement;

export interface VarDeclaration extends BaseNode {
    nodeType: 'VarDeclaration';
    name: string;
    initializer?: Expression;
}

export interface Assignment extends BaseNode {
    nodeType: 'Assignment';
    name: string;
    value: Expression;
}

export interface ReturnStatement extends BaseNode {
    nodeType: 'ReturnStatement';
    value?: Expression;
}

export interface PrintStatement extends BaseNode {
    nodeType: 'PrintStatement';
    expression: Expression;
}

export interface IfStatement extends BaseNode {
    nodeType: 'IfStatement';
    condition: Expression;
    thenStmt: Statement;
    elseStmt?: Statement;
}

export interface WhileStatement extends BaseNode {
    nodeType: 'WhileStatement';
    condition: Expression;
    body: Statement;
}

export interface ExpressionStatement extends BaseNode {
    nodeType: 'ExpressionStatement';
    expression: Expression;
}

export type Expression = BinaryOp | UnaryOp | NumberLiteral | StringLiteral | Identifier | FunctionCall;

export interface BinaryOp extends BaseNode {
    nodeType: 'BinaryOp';
    left: Expression;
    operator: string;
    right: Expression;
}

export interface UnaryOp extends BaseNode {
    nodeType: 'UnaryOp';
    operator: string;
    operand: Expression;
}

export interface NumberLiteral extends BaseNode {
    nodeType: 'Number';
    value: number;
}

export interface StringLiteral extends BaseNode {
    nodeType: 'StringLiteral';
    value: string;
}

export interface Identifier extends BaseNode {
    nodeType: 'Identifier';
    name: string;
}

export interface FunctionCall extends BaseNode {
    nodeType: 'FunctionCall';
    name: string;
    args: Expression[];
}

// =============================================================================
// SEMANTIC ANALYSIS TYPES
// =============================================================================

export interface SemanticReport {
    errors: string[];
}


// =============================================================================
// INTERMEDIATE REPRESENTATION TYPES
// =============================================================================

export type IROp = 
    'ALLOC' | 'STORE' | 'LOAD' | 
    'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MOD' |
    'CMP_EQ' | 'CMP_NE' | 'CMP_LT' | 'CMP_GT' | 'CMP_LE' | 'CMP_GE' |
    'LABEL' | 'JUMP' | 'JUMP_IF_ZERO' |
    'CALL' | 'PARAM' | 'RETURN' |
    'PROLOGUE' | 'EPILOGUE' |
    'PRINT';

export type IROperand = string | number;

export interface IRInstruction {
    op: IROp;
    dest?: IROperand;
    arg1?: IROperand;
    arg2?: IROperand;
}
