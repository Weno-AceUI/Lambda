import { Environment, RuntimeError } from './environment.js';
import { TokenType } from './token.js';

class LambdaFunction {
    constructor(declaration, closure, isInitializer) {
        this.declaration = declaration;
        this.closure = closure;
        this.isInitializer = isInitializer;
    }

    bind(instance) {
        const environment = new Environment(this.closure);
        environment.define("this", instance);
        return new LambdaFunction(this.declaration, environment, this.isInitializer);
    }

    arity() {
        return this.declaration.params.length;
    }

    call(interpreter, args) {
        const environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue) {
            if (this.isInitializer) return this.closure.get({ lexeme: 'this' });
            return returnValue.value;
        }

        if (this.isInitializer) return this.closure.get({ lexeme: 'this' });
        return null;
    }

    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}

class LambdaClass {
    constructor(name, methods) {
        this.name = name;
        this.methods = methods;
        this.staticMethods = new Map();
    }

    findMethod(name) {
        if (this.methods.has(name)) {
            return this.methods.get(name);
        }
        return null;
    }

    findStaticMethod(name) {
        if (this.staticMethods.has(name)) {
            return this.staticMethods.get(name);
        }
        return null;
    }

    toString() {
        return `<class ${this.name}>`;
    }
}

/**
 * The Interpreter walks the Abstract Syntax Tree and executes the code.
 */
export class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;

        // --- Native Functions: The bridge to the OpenAce OS ---

        this.globals.define("clock", {
            arity: () => 0,
            call: (interpreter, args) => Date.now() / 1000.0,
            toString: () => "<native fn clock>"
        });

        // --- Direct UI Component Constructors ---

        this.globals.define("Window", {
            arity: () => 1, // Expects a title string
            call: (interpreter, args) => {
                const title = args[0];
                console.log(`[Native UI] Creating Window with title: "${title}"`);
                // In a real system, this would call WebCpp and return an object with native methods
                const windowInstance = {
                    type: "NativeInstance",
                    class: "Window",
                    properties: {},
                    toString: () => `<ui window: ${title}>`
                };

                // Define an 'add' method on this specific window instance
                windowInstance.properties['add'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        console.log(`[Native UI] Adding ${args[0].toString()} to ${windowInstance.toString()}`);
                    }
                };
                return windowInstance;
            },
            toString: () => "<native class Window>"
        });

        this.globals.define("Button", {
            arity: () => 1, // Expects a label string
            call: (interpreter, args) => {
                const label = args[0];
                console.log(`[Native UI] Creating Button with label: "${label}"`);
                return { type: "NativeInstance", class: "Button", label: label, toString: () => `<ui button: ${label}>` };
            },
            toString: () => "<native class Button>"
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

    executeBlock(statements, environment) {
        const previous = this.environment;
        try {
            this.environment = environment;
            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    // --- Statement Visitors ---

    visitVarStatement(stmt) {
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    visitUiStatement(stmt) {
        // For the interpreter, `ui` is semantically the same as `let`.
        // The keyword exists to provide hints to developers and static analysis tools.
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    visitClassStatement(stmt) {
        this.environment.define(stmt.name.lexeme, null);

        const instanceMethods = new Map();
        const staticMethods = new Map();

        for (const method of stmt.methods) {
            const isInitializer = method.name.lexeme === "init";
            const func = new LambdaFunction(method, this.environment, isInitializer);

            if (method.isStatic) {
                staticMethods.set(method.name.lexeme, func);
            } else {
                instanceMethods.set(method.name.lexeme, func);
            }
        }

        const klass = new LambdaClass(stmt.name.lexeme, instanceMethods);
        klass.staticMethods = staticMethods;
        this.environment.assign(stmt.name, klass);
    }

    visitBlockStatement(stmt) {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }

    visitExpressionStatement(stmt) {
        this.evaluate(stmt.expression);
    }

    visitPrintStatement(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }

    // --- Expression Visitors ---

    visitLiteralExpression(expr) {
        return expr.value;
    }

    visitVariableExpression(expr) {
        return this.environment.get(expr.name);
    }

    visitAssignExpression(expr) {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    visitUnaryExpression(expr) {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -parseFloat(right);
        }

        // Unreachable.
        return null;
    }

    visitBinaryExpression(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return left + right;
                }
                if (typeof left === 'string' && typeof right === 'string') {
                    return left + right;
                }
                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return left - right;
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return left * right;
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return left / right;
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
        }

        return null; // Unreachable
    }

    visitGetExpression(expr) {
        const object = this.evaluate(expr.object);

        if (object instanceof LambdaClass) {
            const staticMethod = object.findStaticMethod(expr.name.lexeme);
            if (staticMethod) return staticMethod;
            throw new RuntimeError(expr.name, `Undefined static method '${expr.name.lexeme}'.`);
        }

        if (object && object.type === 'NativeInstance') {
            if (object.properties.hasOwnProperty(expr.name.lexeme)) {
                return object.properties[expr.name.lexeme];
            }
        } else if (object instanceof LambdaInstance) {
            return object.get(expr.name);
        }
        throw new RuntimeError(expr.name, "Only instances or classes can have properties.");
    }

    visitSetExpression(expr) {
        const object = this.evaluate(expr.object);
        if (!(object instanceof LambdaInstance)) {
            throw new RuntimeError(expr.name, "Only instances have fields.");
        }
        const value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }

    visitCallExpression(expr) {
        const callee = this.evaluate(expr.callee);

        const args = [];
        for (const argument of expr.arguments) {
            args.push(this.evaluate(argument));
        }

        if (callee instanceof LambdaClass) {
            const instance = new LambdaInstance(callee);
            const initializer = callee.findMethod("init");
            if (initializer) {
                initializer.bind(instance).call(this, args);
            }
            return instance;
        }

        if (!(callee instanceof LambdaFunction) && !callee.call) {
            throw new RuntimeError(expr.callee.name || expr.callee.name, "Can only call functions and classes.");
        }

        const func = callee.call ? callee : callee;
        if (args.length !== func.arity()) {
            const errorToken = expr.callee.name || expr.callee;
            throw new RuntimeError(errorToken, `Expected ${func.arity()} arguments but got ${args.length}.`);
        }

        return func.call(this, args);
    }

    visitThisExpression(expr) {
        return this.environment.get(expr.keyword);
    }

    // --- Helper Methods ---

    stringify(object) {
        if (object === null) return "nil";
        return object.toString();
    }

    isTruthy(object) {
        if (object === null) return false;
        if (typeof object === 'boolean') return object;
        return true;
    }

    isEqual(a, b) {
        if (a === null && b === null) return true;
        if (a === null) return false;
        return a === b;
    }

    checkNumberOperand(operator, operand) {
        if (typeof operand === 'number') return;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    checkNumberOperands(operator, left, right) {
        if (typeof left === 'number' && typeof right === 'number') return;
        throw new RuntimeError(operator, "Operands must be numbers.");
    }
}

class LambdaInstance {
    constructor(klass) {
        this.klass = klass;
        this.fields = new Map();
    }

    get(name) {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme);
        }

        const method = this.klass.findMethod(name.lexeme);
        if (method) return method.bind(this);

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
    }

    set(name, value) {
        this.fields.set(name.lexeme, value);
    }

    toString() {
        return `<instance of ${this.klass.name}>`;
    }

}