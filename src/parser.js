import { TokenType } from './token.js';

/**
 * The Parser takes a list of tokens and produces a syntax tree.
 * It checks for grammatical correctness.
 */
export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }

    /**
     * The main entry point. It parses a series of statements until it hits the end.
     */
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        // Filter out nulls from parsing errors before returning
        return statements.filter(s => s !== null);
    }

    // --- Grammar Rule Methods ---

    declaration() {
        try {
            if (this.match(TokenType.LET)) return this.varDeclaration();

            return this.statement();
        } catch (error) {
            // This is a simple panic-mode error recovery.
            // It synchronizes to the next statement boundary.
            this.synchronize();
            return null; // Return null for failed statements
        }
    }

    statement() {
        if (this.match(TokenType.PRINT)) return this.printStatement();

        // In the future, we could parse expression statements here.
        throw this.error(this.peek(), "Expected a statement.");
    }

    varDeclaration() {
        const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');
        
        let initializer = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        
        return {
            type: 'VarStatement',
            name: name,
            initializer: initializer
        };
    }

    printStatement() {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return { type: 'PrintStatement', expression: value };
    }

    expression() {
        // For now, our only expression is a literal number.
        // This will be expanded greatly to handle binary ops, etc.
        return this.call();
    }

    call() {
        let expr = this.primary();

        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                // For now, we don't support arguments, but we parse them.
                // We'll add argument parsing logic here later.
                this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
                expr = { type: 'CallExpression', callee: expr, arguments: [] };
            } else {
                break;
            }
        }

        return expr;
    }

    primary() {
        if (this.match(TokenType.NUMBER)) {
            return { type: 'LiteralExpression', value: this.previous().literal };
        }

        if (this.match(TokenType.STRING)) {
            return { type: 'LiteralExpression', value: this.previous().literal };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'VariableExpression', name: this.previous() };
        }

        throw this.error(this.peek(), "Expect expression.");
    }

    // --- Parser Helper Methods ---

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        throw this.error(this.peek(), message);
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error(token, message) {
        // A more sophisticated error reporting would be needed for a real language
        const err = new Error(`${message} [line ${token.line}]`);
        console.error(err.message);
        return err;
    }

    synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.FN:
                case TokenType.LET:
                    return;
            }
            this.advance();
        }
    }
}