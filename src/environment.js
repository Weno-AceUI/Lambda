/**
 * A custom error class for reporting errors that happen at runtime.
 */
export class RuntimeError extends Error {
    constructor(token, message) {
        super(message);
        this.token = token;
    }
}

/**
 * Manages the state of variables (bindings) in the language.
 */
export class Environment {
    constructor(enclosing = null) {
        this.values = {};
        this.enclosing = enclosing; // For handling nested scopes later
    }

    define(name, value) {
        this.values[name] = value;
    }

    get(nameToken) {
        if (this.values.hasOwnProperty(nameToken.lexeme)) {
            return this.values[nameToken.lexeme];
        }

        throw new RuntimeError(nameToken, `Undefined variable '${nameToken.lexeme}'.`);
    }
}