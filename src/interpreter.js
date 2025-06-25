import { Environment, RuntimeError } from './environment.js';
import { TokenType } from './token.js';
import { WebCpp } from './webcpp-bindings.js'; // Import our WebCpp binding layer

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
    constructor(filePath = 'script') {
        this.globals = new Environment();
        this.environment = this.globals;
        this.filePath = filePath;

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
                const title = this.stringify(args[0]); // Ensure title is a string
                const nativeWindow = WebCpp.createWindow(title); // Call into the native binding

                const windowInstance = {
                    type: "NativeInstance",
                    class: "Window",
                    properties: {}, // Methods will be added here
                    nativeObject: nativeWindow, // Store the actual native object
                    toString: () => `<ui window: ${nativeWindow.title}>`
                };

                // Define an 'add' method on this specific window instance
                windowInstance.properties['add'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        // Assuming args[0] is another NativeInstance with a 'nativeObject' property
                        nativeWindow.add(args[0].nativeObject);
                    }
                };

                // Add setBackgroundColor method
                windowInstance.properties['setBackgroundColor'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        const color = interpreter.stringify(args[0]);
                        nativeWindow.setBackgroundColor(color);
                    }
                };
                return windowInstance;
            },
            toString: () => "<native class Window>"
        });
        this.globals.define("Button", {
            arity: () => 1, // Expects a label string
            call: (interpreter, args) => {
                const label = this.stringify(args[0]);
                const nativeButton = WebCpp.createButton(label);
                const buttonInstance = {
                    type: "NativeInstance", 
                    class: "Button", 
                    properties: {}, 
                    nativeObject: nativeButton, 
                    toString: () => `<ui button: ${nativeButton.label}>`
                };

                // Add setBackgroundColor method
                buttonInstance.properties['setBackgroundColor'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        const color = interpreter.stringify(args[0]);
                        nativeButton.setBackgroundColor(color);
                    }
                };
                return buttonInstance;
            },
            toString: () => "<native class Button>"
        });
        this.globals.define("Label", {
            arity: () => -1, // Variadic: 1 or 2 arguments
            call: (interpreter, args) => {
                if (args.length < 1 || args.length > 2) {
                    throw new RuntimeError(null, "Label() expects 1 or 2 arguments: (text, [classes]).");
                }

                const text = this.stringify(args[0]);
                let classes = [];

                if (args.length === 2) {
                    const classList = args[1];
                    if (!Array.isArray(classList)) {
                        throw new RuntimeError(null, "Second argument to Label() must be a list of strings.");
                    }
                    classes = classList.map(item => this.stringify(item));
                }

                const nativeLabel = WebCpp.createLabel(text, classes);
                const labelInstance = {
                    type: "NativeInstance", 
                    class: "Label", 
                    properties: {}, 
                    nativeObject: nativeLabel, 
                    toString: () => `<ui label: ${nativeLabel.text}>`
                };

                // Add setBackgroundColor method
                labelInstance.properties['setBackgroundColor'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        const color = interpreter.stringify(args[0]);
                        nativeLabel.setBackgroundColor(color);
                    }
                };
                return labelInstance;
            },
            toString: () => "<native class Label>"
        });

        this.globals.define("IconGrid", {
            arity: () => 0,
            call: (interpreter, args) => {
                const nativeGrid = WebCpp.createIconGrid();
                const gridInstance = {
                    type: "NativeInstance",
                    class: "IconGrid",
                    properties: {},
                    nativeObject: nativeGrid,
                    toString: () => `<ui icongrid>`
                };
                gridInstance.properties['add'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        nativeGrid.add(args[0].nativeObject);
                    }
                };
                return gridInstance;
            },
            toString: () => "<native class IconGrid>"
        });

        this.globals.define("Dock", {
            arity: () => 0,
            call: (interpreter, args) => {
                const nativeDock = WebCpp.createDock();
                const dockInstance = {
                    type: "NativeInstance",
                    class: "Dock",
                    properties: {},
                    nativeObject: nativeDock,
                    toString: () => `<ui dock>`
                };
                dockInstance.properties['add'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        nativeDock.add(args[0].nativeObject);
                    }
                };
                return dockInstance;
            },
            toString: () => "<native class Dock>"
        });

        this.globals.define("AppIcon", {
            arity: () => 2, // label, iconPath
            call: (interpreter, args) => {
                const label = this.stringify(args[0]);
                const iconPath = this.stringify(args[1]);
                const nativeIcon = WebCpp.createAppIcon(label, iconPath);
                return {
                    type: "NativeInstance",
                    class: "AppIcon",
                    properties: {},
                    nativeObject: nativeIcon,
                    toString: () => `<ui appicon: ${label}>`
                };
            },
            toString: () => "<native class AppIcon>"
        });

        this.globals.define("BackgroundImage", {
            arity: () => 1, // imagePath
            call: (interpreter, args) => {
                const imagePath = this.stringify(args[0]);
                const nativeBgImage = WebCpp.createBackgroundImage(imagePath);
                return {
                    type: "NativeInstance",
                    class: "BackgroundImage",
                    properties: {},
                    nativeObject: nativeBgImage,
                    toString: () => `<ui background: ${imagePath}>`
                };
            },
            toString: () => "<native class BackgroundImage>"
        });

        this.globals.define("BackgroundColor", {
            arity: () => 1, // color
            call: (interpreter, args) => {
                const color = this.stringify(args[0]);
                const nativeBgColor = WebCpp.createBackgroundColor(color);
                return {
                    type: "NativeInstance",
                    class: "BackgroundColor",
                    properties: {},
                    nativeObject: nativeBgColor,
                    toString: () => `<ui background-color: ${color}>`
                };
            },
            toString: () => "<native class BackgroundColor>"
        });

        this.globals.define("TabBar", {
            arity: () => 0,
            call: (interpreter, args) => {
                const nativeTabBar = WebCpp.createTabBar();
                const tabBarInstance = {
                    type: "NativeInstance",
                    class: "TabBar",
                    properties: {},
                    nativeObject: nativeTabBar,
                    toString: () => `<ui tabbar>`
                };

                tabBarInstance.properties['addTab'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        nativeTabBar.addTab(args[0].nativeObject);
                    }
                };

                tabBarInstance.properties['setActiveTab'] = {
                    arity: () => 1,
                    call: (interpreter, args) => {
                        const tabIndex = args[0];
                        if (typeof tabIndex !== 'number') {
                            throw new RuntimeError(null, "setActiveTab() expects a number index.");
                        }
                        nativeTabBar.setActiveTab(tabIndex);
                    }
                };

                // Add event handling support
                tabBarInstance.properties['setEventHandler'] = {
                    arity: () => 2,
                    call: (interpreter, args) => {
                        const eventName = interpreter.stringify(args[0]);
                        const callback = args[1];
                        nativeTabBar.setEventHandler(eventName, callback);
                    }
                };

                return tabBarInstance;
            },
            toString: () => "<native class TabBar>"
        });

        this.globals.define("Tab", {
            arity: () => 2, // title, content
            call: (interpreter, args) => {
                const title = this.stringify(args[0]);
                const content = args[1]; // This should be a UI component
                
                if (!content || content.type !== "NativeInstance") {
                    throw new RuntimeError(null, "Tab() second argument must be a UI component.");
                }

                const nativeTab = WebCpp.createTab(title, content.nativeObject);
                const tabInstance = {
                    type: "NativeInstance",
                    class: "Tab",
                    properties: {},
                    nativeObject: nativeTab,
                    toString: () => `<ui tab: ${title}>`
                };

                return tabInstance;
            },
            toString: () => "<native class Tab>"
        });

        this.globals.define("len", {
            arity: () => 1,
            call: (interpreter, args) => {
                const list = args[0];
                if (!Array.isArray(list)) {
                    throw new RuntimeError(null, "Argument to len() must be a list.");
                }
                return list.length;
            },
            toString: () => "<native fn len>"
        });

        this.globals.define("get", {
            arity: () => 2,
            call: (interpreter, args) => {
                const [list, index] = args;
                if (!Array.isArray(list) || typeof index !== 'number') {
                    throw new RuntimeError(null, "get() requires a list and a number index.");
                }
                return list[index] || null; // Return nil if out of bounds
            },
            toString: () => "<native fn get>"
        });
    }

    interpret(statements) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                console.error(`[${this.filePath}:${error.token.line}] RuntimeError: ${error.message}`);
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

    visitIfStatement(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
            this.execute(stmt.elseBranch);
        }
        return null;
    }

    visitHandleStatement(stmt) {
        const component = this.environment.get(stmt.componentName); // Get the UI component instance
        const eventName = stmt.eventName.lexeme; // Get the event name string

        if (component && component.type === 'NativeInstance' && component.nativeObject) {
            // Create a LambdaFunction that wraps the block and captures the current environment
            const callbackFunction = {
                arity: () => 0, // Event handlers typically take no arguments or event object
                call: (interpreter, args) => {
                    // Execute the block in a new environment that extends the captured one
                    interpreter.executeBlock(stmt.body, new Environment(this.environment));
                    return null;
                },
                toString: () => `<event handler for ${eventName}>`
            };

            if (typeof component.nativeObject.setEventHandler === 'function') {
                component.nativeObject.setEventHandler(eventName, callbackFunction);
            } else {
                throw new RuntimeError(stmt.componentName, `UI component '${stmt.componentName.lexeme}' does not support event handling for '${eventName}'.`);
            }
        } else {
            throw new RuntimeError(stmt.componentName, `Cannot attach event handler to non-UI component '${stmt.componentName.lexeme}'.`);
        }
        return null;
    }

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

    visitListLiteralExpression(expr) {
        const elements = [];
        for (const elementExpr of expr.elements) {
            elements.push(this.evaluate(elementExpr));
        }
        return elements;
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
        const arity = func.arity();
        if (arity >= 0 && args.length !== arity) {
            const errorToken = expr.callee.name || expr.callee;
            throw new RuntimeError(errorToken, `Expected ${arity} arguments but got ${args.length}.`);
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