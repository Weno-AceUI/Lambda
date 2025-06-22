import { TokenType } from './token.js';

const keywords = {
    "class": TokenType.CLASS,
    "else": TokenType.ELSE,
    "fn": TokenType.FN,
    "if": TokenType.IF,
    "let": TokenType.LET,
    "print": TokenType.PRINT,
    "this": TokenType.THIS,
    "static": TokenType.STATIC,
    "ui": TokenType.UI,
    "true": TokenType.TRUE,
    "false": TokenType.FALSE,
    "nil": TokenType.NIL,
};

export class Lexer {
    constructor(source, filePath = 'script') {
        this.source = source;
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.filePath = filePath;
        this.tokens = [];
        this.errors = [];
        this.lineStart = 0;
    }

    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({ type: TokenType.EOF, lexeme: "", literal: null, line: this.line, column: this.current - this.lineStart });
        return this.tokens;
    }

    isAtEnd() {
        return this.current >= this.source.length;
    }

    scanToken() {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*':
                if (this.match('*')) {
                    // A block comment. Consume until the closing **
                    while (!(this.peek() === '*' && this.peekNext() === '*') && !this.isAtEnd()) {
                        if (this.peek() === '\n') this.line++;
                        this.advance();
                    }

                    if (this.isAtEnd()) {
                        this.reportError("Unterminated comment.");
                    } else {
                        // Consume the closing '**'
                        this.advance();
                        this.advance();
                    }
                } else {
                    this.addToken(TokenType.STAR);
                }
                break;
            case '/': this.addToken(TokenType.SLASH); break;

            // Two-character tokens
            case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG); break;
            case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;
            case '<': this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS); break;
            case '>': this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER); break;

            case '"': this.string(); break;

            // Ignore whitespace
            case ' ':
            case '\r':
            case '\t':
                break;

            case '\n':
                this.line++;
                this.lineStart = this.current;
                break;

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    this.reportError(`Unexpected character: '${c}'`);
                }
                break;
        }
    }

    advance() {
        return this.source.charAt(this.current++);
    }

    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        const column = this.start - this.lineStart;
        this.tokens.push({ type, lexeme: text, literal, line: this.line, column });
    }

    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current++;
        return true;
    }

    isDigit(c) {
        return c >= '0' && c <= '9';
    }

    isAlpha(c) {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
                c === '_';
    }

    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        // We could add floating point support here later
        this.addToken(TokenType.NUMBER,
            parseFloat(this.source.substring(this.start, this.current)));
    }

    string() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.reportError("Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();

        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this.source.substring(this.start, this.current);
        const type = keywords[text] || TokenType.IDENTIFIER;
        this.addToken(type);
    }

    reportError(message) {
        const column = this.current - this.lineStart - 1;
        this.errors.push({
            range: {
                start: { line: this.line - 1, character: column },
                end: { line: this.line - 1, character: column + 1 }
            },
            message: message,
            severity: 1 // Error
        });

        // Also log to console for the command-line runner
        console.error(`[${this.filePath}:${this.line}] Error: ${message}`);
    }
}