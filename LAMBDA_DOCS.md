# Lambda Language Documentation

Welcome to the official documentation for the Lambda programming language. This document provides a comprehensive guide to writing code in Lambda, covering its syntax, features, and core concepts.

## 1. Comments

Comments are used to write notes in the code that are ignored by the interpreter. In Lambda, comments are enclosed in `** ... ** `.

```lambda
** This is a comment. **
let a = 10; ** This is an inline comment. **
```

## 2. Variables

Variables are used to store data. They are declared with the `let` keyword.

```lambda
let my_variable = "Hello, Lambda!";
let number = 100;
print my_variable;
```

## 3. Data Types

Lambda is a dynamically-typed language and supports the following data types:

-   **String**: A sequence of characters enclosed in double quotes.
    ```lambda
    let greeting = "Hello";
    ```
-   **Number**: Both integers and floating-point numbers.
    ```lambda
    let count = 10;
    let price = 19.99;
    ```
-   **Boolean**: Represents `true` or `false` logical values.
    ```lambda
    let is_active = true;
    let has_permission = false;
    ```
-   **Nil**: Represents the absence of a value, similar to `null` in other languages.
    ```lambda
    let no_value = nil;
    ```

## 4. Operators

Lambda supports standard arithmetic and comparison operators.

-   **Arithmetic Operators**: `+`, `-`, `*`, `/`
-   **Comparison Operators**: `==`, `!=`, `<`, `<=`, `>`, `>=`
-   **Logical NOT**: `!`

```lambda
let a = 10;
let b = 20;

print a + b;      ** 30 **
print b / a;      ** 2 **
print a < b;      ** true **
print a == 10;    ** true **
print not (a == 10); ** false **
```

## 5. Control Flow

Conditional logic is handled using `if/else` statements.

```lambda
let a = 10;
if (a > 5) {
    print "a is greater than 5";
} else {
    print "a is not greater than 5";
}
```

## 6. Built-in Functions

Lambda provides a set of built-in functions. `print` is one such function for writing output to the console.

```lambda
print "Hello, World!";
```

## 7. Classes

Lambda is an object-oriented language and supports classes.

### Defining a Class

Classes are defined using the `class` keyword.

```lambda
class Point {
    ** methods go here **
}
```

### Constructor

The `init` method is the class constructor, called when a new instance is created.

```lambda
class Point {
    init(x, y) {
        this.x = x;
        this.y = y;
    }
}
```

### Methods

Methods are functions defined inside a class.

```lambda
class Point {
    init(x, y) {
        this.x = x;
        this.y = y;
    }

    move(dx, dy) {
        this.x = this.x + dx;
        this.y = this.y + dy;
    }
}
```

### Static Methods

Static methods belong to the class itself, not to an instance. They are declared with the `static` keyword.

```lambda
class Point {
    ** ... instance methods ... **
    static origin() {
        return Point(0, 0);
    }
}
```

### Creating Instances

You create a new instance of a class by calling the class name as if it were a function.

```lambda
let p1 = Point(10, 20);
print p1.x; ** 10 **

let origin = Point.origin();
print origin.x; ** 0 **
```

## 8. UI Programming

Lambda has special syntax for building user interfaces. The `ui` keyword is used to declare UI components.

```lambda
** This declares a window. 'Window' is a native UI component. **
ui main_window = Window("My App");

ui my_label = Label("Welcome!");
ui my_button = Button("Click Me");

** Components can be nested **
main_window.add(my_label);
main_window.add(my_button);
```

This concludes the overview of the Lambda programming language. Happy coding! 