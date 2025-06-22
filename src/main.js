import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import { TokenType } from './token.js'; // For potential debugging

function run(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (parser.errors > 0) { // A better check would be to have an error count in the parser
        console.error("Execution halted due to parsing errors.");
        return;
    }

    const interpreter = new Interpreter();
    interpreter.interpret(statements);
}

const sampleCode = `
let greeting = "Hello, " + "World!";
print greeting;

let calculation = (10 * 2) + (100 / 5);
print "The result is: " + calculation;
`;
run(sampleCode);
