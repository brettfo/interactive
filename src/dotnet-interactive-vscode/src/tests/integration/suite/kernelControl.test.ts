// Copyright (c) .NET Foundation and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as fs from 'fs';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('kernel control tests', () => {

    suiteSetup(async function () {
        await vscode.extensions.getExtension('ms-dotnettools.dotnet-interactive-vscode')?.activate();
    });

    test('asdf', async () => {
        const testNotebookResult = tmp.fileSync({prefix: 'testNotebook-', postfix: '.dib'});
        const testNotebookUri = vscode.Uri.file(testNotebookResult.name);
        const testNotebookContents = `
#!csharp
System.Threading.Thread.Sleep(30000);
`;
        fs.writeFileSync(testNotebookUri.fsPath, testNotebookContents);

        await vscode.commands.executeCommand('vscode.openWith', testNotebookUri, 'dotnet-interactive');

        const document = vscode.notebook.activeNotebookEditor?.document;

        assert.equal(document!.cells.length, 1);
    });

});
