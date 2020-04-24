import * as vscode from 'vscode';
import { InteractiveClient } from './interactiveClient';
import { CommandFailed, ReturnValueProduced } from './interfaces';

interface NotebookFile {
    cells: Array<RawNotebookCell>;
}

interface RawNotebookCell {
    kind: vscode.CellKind;
    language: string;
    content: string;
    outputs: Array<vscode.CellOutput>;
}

export class DotNetInteractiveNotebookProvider implements vscode.NotebookProvider {

    constructor(readonly client: InteractiveClient) {
    }

    async resolveNotebook(editor: vscode.NotebookEditor): Promise<void> {
        editor.document.languages = ['dotnet-interactive'];

        let contents = '';
        try {
            contents = Buffer.from(await vscode.workspace.fs.readFile(editor.document.uri)).toString('utf-8');
        } catch {
        }

        let notebook: NotebookFile;
        try {
            notebook = <NotebookFile>JSON.parse(contents);
        } catch {
            notebook = {
                cells: []
            };
        }

        editor.edit(editBuilder => {
            for (let cell of notebook.cells) {
                editBuilder.insert(
                    0,
                    cell.content,
                    cell.language,
                    cell.kind,
                    cell.outputs,
                    {
                        editable: true,
                        runnable: true
                    }
                );
            }
        });

        setTimeout(() => {
            for (let cell of editor.document.cells) {
                if (cell.cellKind === vscode.CellKind.Code) {
                    //
                }
            }
        }, 0);
    }

    executeCell(document: vscode.NotebookDocument, cell: vscode.NotebookCell | undefined, token: vscode.CancellationToken): Promise<void> {
        if (!cell) {
            // TODO: run everything
            return Promise.resolve();
        }

        let source = cell.source.toString();
        return this.client.submitCode(source, (event, eventType) => {
            switch (eventType) {
                case "CommandFailed":
                    {
                        let err = <CommandFailed>event;
                        let output: vscode.CellErrorOutput = {
                            outputKind: vscode.CellOutputKind.Error,
                            ename: "ename",
                            evalue: err.message,
                            traceback: [],
                        };
                        cell.outputs = [output];
                    }
                    break;
                case "ReturnValueProduced":
                    {
                        let rvt = <ReturnValueProduced>event;
                        let data: { [key: string]: any } = {};
                        for (let formatted of rvt.formattedValues) {
                            data[formatted.mimeType] = formatted.value;
                        }
                        let output: vscode.CellDisplayOutput = {
                            outputKind: vscode.CellOutputKind.Rich,
                            data: data
                        };
                        cell.outputs = [output];
                    }
                    break;
            }
        });
    }

    async save(document: vscode.NotebookDocument): Promise<boolean> {
        let notebook: NotebookFile = {
            cells: []
        };
        for (let cell of document.cells) {
            notebook.cells.push({
                language: cell.language,
                content: cell.document.getText(),
                outputs: cell.outputs,
                kind: cell.cellKind
            });
        }

        await vscode.workspace.fs.writeFile(document.uri, Buffer.from(JSON.stringify(notebook, null, 2)));
        return true;
    }
}