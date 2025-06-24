import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import { renderPreview, resetPreview } from './webcpp-bindings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(source, filePath) {
    resetPreview(); // Clear any previous UI state
    const lexer = new Lexer(source, filePath);
    const tokens = lexer.scanTokens();

    const parser = new Parser(tokens, filePath);
    const statements = parser.parse();

    if (parser.errors.length > 0) {
        console.error("Execution halted due to parsing errors.");
        return;
    }

    const interpreter = new Interpreter(filePath);
    interpreter.interpret(statements);

    // After interpretation, attempt to render a UI preview
    const html = renderPreview();
    if (html) {
        const previewPath = path.join(path.dirname(filePath), 'preview.html');
        fs.writeFileSync(previewPath, html);
        console.log(`\n---`);
        console.log(`[*] App Preview Generated. Open this file in your browser:`);
        console.log(`    ${previewPath}`);
    }
}

function runFile(filePath) {
    const absolutePath = path.resolve(filePath);
    try {
        const source = fs.readFileSync(absolutePath, 'utf8');
        run(source, absolutePath);
    } catch (err) {
        console.error(`Could not read file: ${filePath}`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length > 1) {
    console.log("Usage: node src/main.js [script]");
    process.exit(64);
} else if (args.length === 1) {
    runFile(args[0]);
} else {
    runFile(path.resolve(__dirname, '..', 'vscode-lambda', 'test.lba')); // Run test.lba by default
}
