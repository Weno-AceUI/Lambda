import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';

function run(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    // A simple check to see if any statement failed to parse
    if (statements.some(s => s === null)) {
        console.error("Execution halted due to parsing errors.");
        return;
    }

    const interpreter = new Interpreter();
    interpreter.interpret(statements);
}

const sampleCode = `
print "The time is:";
print clock();
`;
run(sampleCode);
