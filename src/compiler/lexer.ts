import { TokenType, Token } from "./types";

export class Lexer {
    private pos = 0;
    private line = 1;
    private column = 1;
    private tokens: Token[] = [];

    private readonly keywords: { [key: string]: TokenType } = {
        'int': TokenType.INT,
        'return': TokenType.RETURN,
        'if': TokenType.IF,
        'else': TokenType.ELSE,
        'while': TokenType.WHILE,
    };

    private readonly operators: { [key: string]: TokenType } = {
        '+': TokenType.PLUS,
        '-': TokenType.MINUS,
        '*': TokenType.MULTIPLY,
        '/': TokenType.DIVIDE,
        '=': TokenType.ASSIGN,
        '<': TokenType.LESS_THAN,
        '>': TokenType.GREATER_THAN,
        ';': TokenType.SEMICOLON,
        ',': TokenType.COMMA,
        '(': TokenType.LPAREN,
        ')': TokenType.RPAREN,
        '{': TokenType.LBRACE,
        '}': TokenType.RBRACE,
    };

    constructor(private source: string) {}

    private currentChar(): string | null {
        return this.pos >= this.source.length ? null : this.source[this.pos];
    }

    private peekChar(): string | null {
        return this.pos + 1 >= this.source.length ? null : this.source[this.pos + 1];
    }

    private advance() {
        if (this.pos < this.source.length && this.source[this.pos] === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        this.pos++;
    }

    private skipWhitespace() {
        while (this.currentChar() && /\s/.test(this.currentChar()!)) {
            this.advance();
        }
    }

    private readNumber(): string {
        let num = "";
        while (this.currentChar() && /\d/.test(this.currentChar()!)) {
            num += this.currentChar();
            this.advance();
        }
        return num;
    }

    private readIdentifier(): string {
        let ident = "";
        while (this.currentChar() && (/\w/.test(this.currentChar()!))) {
            ident += this.currentChar();
            this.advance();
        }
        return ident;
    }

    public tokenize(): Token[] {
        while (this.currentChar()) {
            this.skipWhitespace();

            const char = this.currentChar();
            if (!char) break;

            const line = this.line;
            const col = this.column;

            // Handle comments first to avoid confusion with division operator
            if (char === '/' && this.peekChar() === '/') {
                while (this.currentChar() && this.currentChar() !== '\n') {
                    this.advance();
                }
                continue; // Skip the rest of the loop for this token
            }
            
            // Handle two-character operators
            if (char === '=' && this.peekChar() === '=') {
                this.advance(); this.advance();
                this.tokens.push({ type: TokenType.EQUAL, value: "==", line, column: col });
                continue;
            }
            if (char === '!' && this.peekChar() === '=') {
                this.advance(); this.advance();
                this.tokens.push({ type: TokenType.NOT_EQUAL, value: "!=", line, column: col });
                continue;
            }
            if (char === '<' && this.peekChar() === '=') {
                this.advance(); this.advance();
                this.tokens.push({ type: TokenType.LESS_EQUAL, value: "<=", line, column: col });
                continue;
            }
            if (char === '>' && this.peekChar() === '=') {
                this.advance(); this.advance();
                this.tokens.push({ type: TokenType.GREATER_EQUAL, value: ">=", line, column: col });
                continue;
            }

            // Handle single-character operators
            if (this.operators[char]) {
                this.tokens.push({ type: this.operators[char], value: char, line, column: col });
                this.advance();
                continue;
            }
            
            // Handle numbers
            if (/\d/.test(char)) {
                const value = this.readNumber();
                this.tokens.push({ type: TokenType.NUMBER, value, line, column: col });
                continue;
            }
            
            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(char)) {
                const value = this.readIdentifier();
                const type = this.keywords[value] || TokenType.IDENTIFIER;
                this.tokens.push({ type, value, line, column: col });
                continue;
            }
            
            throw new Error(`Unexpected character '${char}' at line ${line}, column ${col}`);
        }
        this.tokens.push({ type: TokenType.EOF, value: "", line: this.line, column: this.column });
        return this.tokens;
    }
}
