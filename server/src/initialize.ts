import {
  InitializeResult,
  RequestMessage,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

export const initialize = (_message: RequestMessage): InitializeResult => {
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: true,
      },
      textDocumentSync: TextDocumentSyncKind.Incremental,
      codeActionProvider: {
        resolveProvider: true,
      },
    },
    serverInfo: {
      name: "github-copilot-clone-server",
      version: "0.0.1",
    },
  };
};
