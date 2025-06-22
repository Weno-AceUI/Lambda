import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    DidChangeConfigurationNotification
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Import our Lambda language tools
import { Lexer } from '../../src/lexer.js';
import { Parser } from '../../src/parser.js';

// Create a connection for the server.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
        }
    };
});

documents.onDidChangeContent(change => {
    validateLambdaDocument(change.document);
});

function validateLambdaDocument(textDocument) {
    const text = textDocument.getText();
    const filePath = textDocument.uri;

    const lexer = new Lexer(text, filePath);
    const tokens = lexer.scanTokens();
    const lexerErrors = lexer.errors;

    const parser = new Parser(tokens, filePath);
    parser.parse();
    const parserErrors = parser.errors;

    const diagnostics = [...lexerErrors, ...parserErrors];

    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();