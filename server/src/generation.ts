import { Position, RequestMessage } from "vscode-languageserver/node";
import { HumanMessage } from "@langchain/core/messages";
import { model } from "./openaiClient";
import { Parameters, systemPrompt } from "./template";

interface MessageParamsType {
  textDocument: {
    uri: string;
    text: string;
  };
  position: Position;
  fsPath: string;
}

export const generation = async (message: RequestMessage) => {
  try {
    if (!message) {
      return {};
    }

    const params: MessageParamsType = message.params as MessageParamsType;

    const text = params.textDocument.text;
    if (!text) {
      return {};
    }

    const line = params.position.line;
    const character = params.position.character;

    const cursorText = getNewCursorText(text, line, character);

    const response = await getResponseFromLLM(cursorText, params.fsPath);

    return {
      generatedText: response,
    };
  } catch (error) {
    console.error(`error while Generating the Response : ${error}`);
    throw error;
  }
};

const getNewCursorText = (text: string, line: number, character: number) => {
  const lines = text.split("\n");
  if (line < 0 || line > lines.length) {
    return text;
  }

  const targetLine = lines[line];
  if (character < 0 || character > targetLine.length) {
    return text;
  }

  lines[line] =
    targetLine.slice(0, character) + "<CURSOR>" + targetLine.slice(character);

  return lines.join("\n");
};

const getResponseFromLLM = async (text: string, fsPath: string) => {
  try {
    const systemMetaData: Parameters = {
      fsPath: fsPath,
      max_tokens: 128,
      max_context: 1024,
    };

    const messages = [systemPrompt(systemMetaData), new HumanMessage(text)];

    const chatCompletion = await model.invoke(messages);
    if (!chatCompletion || !chatCompletion.content) {
      return "";
    }

    return chatCompletion.content;
  } catch (error) {
    console.error(`error while Getting the Response from LLM : ${error}`);
    throw error;
  }
};
