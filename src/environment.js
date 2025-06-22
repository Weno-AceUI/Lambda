export class RuntimeError extends Error {
    constructor(token, message) {
        super(message);
        this.token = token;
    }
}

export class Environment {
    constructor(enclosing = null) {
        this.values = new Map();
        this.enclosing = enclosing;
    }

    define(name, value) {
        this.values.set(name, value);
    }

    get(name) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }
        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name, value) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
}