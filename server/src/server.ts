import {
  InitializeResult,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
} from "vscode-languageserver/node";
import { initialize } from "./initialize";
import { shutdown } from "./shutdown";
import { exit } from "./exit";
import { generation } from "./generation";

interface MethodStoreType {
  initialize: (message: RequestMessage) => InitializeResult;
  shutdown: () => void;
  exit: () => void;
  "textDocument/generation": (message: RequestMessage) => void;
}

interface MessageMetaDataType {
  contentLength: number;
  messageStart: number;
}

let buffer = "";

const methodStore: MethodStoreType = {
  initialize,
  shutdown,
  exit,
  "textDocument/generation": generation,
};

process.stdin.on("data", async (bufferChunk: Buffer) => {
  buffer += bufferChunk;

  while (true) {
    const messageMeta = extractMessageMetaData(buffer);
    if (!messageMeta) {
      break;
    }

    const { contentLength, messageStart } = messageMeta;
    if (buffer.length < messageStart + contentLength) {
      break;
    }

    const rawMessage = buffer.slice(messageStart, messageStart + contentLength);
    buffer = buffer.slice(messageStart + contentLength);

    try {
      const message: RequestMessage = JSON.parse(rawMessage);

      const method = methodStore[message.method as keyof MethodStoreType];

      if (method) {
        const result = await method(message);

        if (result) {
          const response: ResponseMessage = {
            id: message.id,
            jsonrpc: message.jsonrpc,
            result: result,
          };
          respond(response);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage: NotificationMessage = {
        jsonrpc: "2.0",
        method: "window/showMessage",
        params: {
          type: 1,
          message: `Error processing request: ${error.message}`,
        },
      };

      respond(errorMessage);
    }
  }
});

function extractMessageMetaData(buffer: string): MessageMetaDataType | null {
  const lengthMatch = buffer.match(/Content-Length: (\d+)\r\n/);
  if (!lengthMatch) {
    return null;
  }

  const contentLength = parseInt(lengthMatch[1], 10);
  const messageStart = buffer.indexOf("\r\n\r\n") + 4;
  return { contentLength, messageStart };
}

function respond(response: ResponseMessage | NotificationMessage): void {
  const responseString = JSON.stringify(response);
  const contentLength = Buffer.byteLength(responseString, "utf-8");
  const header = `Content-Length: ${contentLength}\r\n\r\n`;

  process.stdout.write(header + responseString);
}
