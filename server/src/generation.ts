import { Position, RequestMessage } from "vscode-languageserver/node";
import { ChatCompletionMessageParam } from "openai/resources";
import { client } from "./openaiClient";
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
    console.log(`error while Generating the Response : ${error}`);
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

    const message: ChatCompletionMessageParam = {
      role: "user",
      content: text,
    };

    const messages = [systemPrompt(systemMetaData), message];

    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: systemMetaData.max_tokens ?? 128,
    });
    if (!chatCompletion) {
      return "";
    }

    const generatedResponse = chatCompletion.choices[0].message.content;
    if (!generatedResponse) {
      return "";
    }

    return generatedResponse;
  } catch (error) {
    console.log(`error while Getting the Response from LLM : ${error}`);
    throw error;
  }
};
