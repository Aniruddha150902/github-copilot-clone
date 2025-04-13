import * as path from "path";
import {
  ExtensionContext,
  InlineCompletionItem,
  InlineCompletionItemProvider,
  languages,
  Position,
  SnippetString,
  TextDocument,
  workspace,
} from "vscode";
import {
  CancellationToken,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

const EXTENSION_ID = "github-copilot-clone";

let client: LanguageClient;

let lastInlineCompletion = Date.now();
const lastPosition: Position | null = null;
let inlineCompletionRequestCounter = 0;

const inLineCompletionConfig = getConfiguration(
  "inlineCompletionConfiguration"
);

function getConfiguration(configName: string) {
  if (
    Object.keys(workspace.getConfiguration(EXTENSION_ID).get(configName))
      .length > 0
  ) {
    return workspace.getConfiguration(EXTENSION_ID).get(configName);
  }
  return null;
}

const getInlineCompletionItems = async (
  document: TextDocument,
  position: Position,
  mode: "slow" | "fast"
) => {
  const params = {
    textDocument: {
      uri: document.uri.toString(),
      text: document.getText(),
    },
    position: position,
    fsPath: document.uri.fsPath.toString(),
  };

  inlineCompletionRequestCounter++;

  const minInterval =
    mode === "fast" ? 0 : 1 / inLineCompletionConfig["maxCompletionsPerSecond"];

  const localInlineCompletionRequestCounter = inlineCompletionRequestCounter;
  const timeSinceLastCompletion = (Date.now() - lastInlineCompletion) / 1000;

  if (timeSinceLastCompletion < minInterval) {
    await new Promise((resolve) => {
      setInterval(resolve, (minInterval - timeSinceLastCompletion) * 1000);
    });
  }

  if (localInlineCompletionRequestCounter === inlineCompletionRequestCounter) {
    lastInlineCompletion = Date.now();

    let cancellationToken = CancellationToken.None;

    if (lastPosition && position.isAfter(lastPosition)) {
      cancellationToken = CancellationToken.Cancelled;
    }

    try {
      const response: string = await client.sendRequest(
        "textDocument/generation",
        params,
        cancellationToken
      );

      const snippetCode = new SnippetString(response);
      return [new InlineCompletionItem(snippetCode)];
    } catch (error) {
      console.log(`Error While Getting the Inline Completion Items : ${error}`);
      throw error;
    }
  } else {
    return [];
  }
};

export function activate(context: ExtensionContext) {
  console.log("Inside Activate Function");

  const serverMoodule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );

  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  const serverOptions: ServerOptions = {
    run: { module: serverMoodule, transport: TransportKind.stdio },
    debug: {
      module: serverMoodule,
      transport: TransportKind.stdio,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file" }],
  };

  client = new LanguageClient(
    "github-copilot-clone",
    serverOptions,
    clientOptions
  );

  client.start();

  const provider: InlineCompletionItemProvider = {
    async provideInlineCompletionItems(document, position, _context, _token) {
      try {
        console.log("provideInlineCompletionItems triggered");

        const mode = inLineCompletionConfig["mode"] || "slow";

        return await getInlineCompletionItems(document, position, mode);
      } catch (error) {
        console.log(`error while Providing Inline Completion Items : ${error}`);
        throw error;
      }
    },
  };
  languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);
}

export function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
