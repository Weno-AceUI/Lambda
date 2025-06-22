import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node.js';

let client;

export function activate(context) {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));

    // The debug options for the server
    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'lambda' }]
    };

    client = new LanguageClient('lambdaLanguageServer', 'Lambda Language Server', serverOptions, clientOptions);
    client.start();
}

export function deactivate() {
    if (!client) return undefined;
    return client.stop();
}