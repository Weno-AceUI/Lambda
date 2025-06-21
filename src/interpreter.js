import { Environment, RuntimeError } from './environment.js';

/**
 * The Interpreter walks the Abstract Syntax Tree and executes the code.
 */
export class Interpreter {
    constructor() {
        // The global environment for the duration of the session.
        this.environment = new Environment();

        // Define a native function.
        // This is the bridge from Lambda to the host (JavaScript).
        this.environment.define("clock", {
            // arity is the number of arguments the function expects.
            arity: () => 0,
            // call is the actual JS code that gets executed.
            call: (interpreter, args) => {
                return Date.now() / 1000.0;
            },
            toString: () => "<native fn>"
        });
    }

    interpret(statements) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                console.error(`RuntimeError: ${error.message} [line ${error.token.line}]`);
            } else {
                console.error(`An unexpected error occurred: ${error}`);
            }
        }
    }

    execute(stmt) {
        // This is a simple implementation of the Visitor pattern.
        // It calls the appropriate method based on the statement's type.
        const visitorMethod = `visit${stmt.type}`;
        if (this[visitorMethod]) {
            return this[visitorMethod](stmt);
        }
        throw new Error(`No visitor method for statement type: ${stmt.type}`);
    }

    evaluate(expr) {
        const visitorMethod = `visit${expr.type}`;
        if (this[visitorMethod]) {
            return this[visitorMethod](expr);
        }
        throw new Error(`No visitor method for expression type: ${expr.type}`);
    }

    visitVarStatement(stmt) {
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    visitLiteralExpression(expr) {
        return expr.value;
    }

    visitVariableExpression(expr) {
        return this.environment.get(expr.name);
    }

    visitCallExpression(expr) {
        const callee = this.evaluate(expr.callee);

        // For now, we don't have arguments, so this is simple.
        const args = [];

        // Check if the thing we're calling is actually a function.
        if (!callee.call) {
            throw new RuntimeError(expr.callee.name, "Can only call functions and classes.");
        }

        // In the future, we will check arity (argument count) here.

        return callee.call(this, args);
    }

    visitPrintStatement(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }

    stringify(object) {
        if (object === null) return "nil";
        return object.toString();
    }
}