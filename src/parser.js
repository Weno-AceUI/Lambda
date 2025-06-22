import { TokenType } from './token.js';

/**
 * The Parser takes a list of tokens and produces a syntax tree.
 * It checks for grammatical correctness.
 */
export class Parser {
    constructor(tokens, filePath = 'script') {
        this.tokens = tokens;
        this.current = 0;
        this.errors = 0;
        this.filePath = filePath;
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
            if (this.match(TokenType.CLASS)) return this.classDeclaration();
            if (this.match(TokenType.UI)) return this.uiDeclaration();
            if (this.match(TokenType.LET)) return this.varDeclaration();

            return this.statement();
        } catch (error) {
            // This is a simple panic-mode error recovery.
            // It synchronizes to the next statement boundary.
            this.synchronize();
            return null; // Return null for failed statements
        }
    }

    classDeclaration() {
        const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");
        this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

        const methods = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const isStatic = this.match(TokenType.STATIC);
            const method = this.function("method");
            methods.push({ ...method, isStatic });
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");
        return { type: 'ClassStatement', name: name, methods: methods };
    }

    statement() {
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.PRINT)) return this.printStatement();
        if (this.match(TokenType.LEFT_BRACE)) return { type: 'BlockStatement', statements: this.block() };

        return this.expressionStatement();
    }

    block() {
        const statements = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    }

    expressionStatement() {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return { type: 'ExpressionStatement', expression: expr };
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

    uiDeclaration() {
        const name = this.consume(TokenType.IDENTIFIER, 'Expect UI component name.');

        let initializer = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after UI declaration.");

        return {
            type: 'UiStatement',
            name: name,
            initializer: initializer
        };
    }

    printStatement() {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return { type: 'PrintStatement', expression: value };
    }

    ifStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return { type: 'IfStatement', condition, thenBranch, elseBranch };
    }

    expression() {
        return this.assignment();
    }

    equality() {
        let expr = this.comparison();

        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = { type: 'BinaryExpression', left: expr, operator: operator, right: right };
        }

        return expr;
    }

    comparison() {
        let expr = this.term();

        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = { type: 'BinaryExpression', left: expr, operator: operator, right: right };
        }

        return expr;
    }

    term() {
        let expr = this.factor();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = { type: 'BinaryExpression', left: expr, operator: operator, right: right };
        }

        return expr;
    }

    factor() {
        let expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = { type: 'BinaryExpression', left: expr, operator: operator, right: right };
        }

        return expr;
    }

    unary() {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return { type: 'UnaryExpression', operator: operator, right: right };
        }
        return this.call();
    }

    assignment() {
        const expr = this.call();

        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();

            if (expr.type === 'VariableExpression') {
                const name = expr.name;
                return { type: 'AssignExpression', name: name, value: value };
            } else if (expr.type === 'GetExpression') {
                const setExpr = { type: 'SetExpression', object: expr.object, name: expr.name, value: value };
                return setExpr;
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    call() {
        let expr = this.primary();

        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                const args = [];
                if (!this.check(TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.expression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
                expr = { type: 'CallExpression', callee: expr, arguments: args };
            } else if (this.match(TokenType.DOT)) {
                const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = { type: 'GetExpression', object: expr, name: name };
            } else {
                break;
            }
        }

        return expr;
    }

    primary() {
        if (this.match(TokenType.TRUE)) return { type: 'LiteralExpression', value: true };
        if (this.match(TokenType.FALSE)) return { type: 'LiteralExpression', value: false };
        if (this.match(TokenType.NIL)) return { type: 'LiteralExpression', value: null };

        if (this.match(TokenType.NUMBER)) {
            return { type: 'LiteralExpression', value: this.previous().literal };
        }

        if (this.match(TokenType.STRING)) {
            return { type: 'LiteralExpression', value: this.previous().literal };
        }

        if (this.match(TokenType.THIS)) {
            return { type: 'ThisExpression', keyword: this.previous() };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'VariableExpression', name: this.previous() };
        }

        if (this.match(TokenType.LEFT_BRACKET)) {
            const elements = [];
            if (!this.check(TokenType.RIGHT_BRACKET)) {
                do {
                    elements.push(this.expression());
                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after list elements.");
            return { type: 'ListLiteralExpression', elements: elements };
        }

        throw this.error(this.peek(), "Expect expression.");
    }

    function(kind) {
        const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        const parameters = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }
                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
        const body = this.block();

        return { type: 'FunctionStatement', name, params: parameters, body };
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
        const location = token.type === TokenType.EOF ? "at end" : `at '${token.lexeme}'`;
        const err = new Error(`[${this.filePath}:${token.line}] Error ${location}: ${message}`);
        console.error(err.message);
        this.errors++;
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