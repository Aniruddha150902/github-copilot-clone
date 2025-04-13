import { ChatCompletionMessageParam } from "openai/resources";

export interface Parameters {
  fsPath: string;
  max_tokens?: number;
  max_context?: number;
}

export const systemPrompt = (
  paramaters: Parameters
): ChatCompletionMessageParam => {
  return {
    role: "system",
    content: `
        Instructions:
            - You are an AI programming assistant.
            - Given a piece of code with the cursor location marked by <CURSOR>, replace <CURSOR> with the correct code.
            - First, think step-by-step.
            - Describe your plan for what to build in pseudocode, written out in great detail.
            - Then output the code replacing the <CURSOR>.
            - Ensure that your completion fits within the language context of the provided code snippet.
            - Ensure, completion is what ever is needed, dont write beyond 1 or 2 line, unless the <CURSOR> is on start of a function, class or any control statment(if, switch, for, while).

            Rules:
            - Only respond with code.
            - Only replace <CURSOR>; do not include any previously written code.
            - Never include <CURSOR> in your response.
            - Handle ambiguous cases by providing the most contextually appropriate completion.
            - Be consistent with your responses.
            - You should only generate code in the language specified in the META_DATA.
            - Never mix text with code.
            - your code should have appropriate spacing.

            META_DATA: 
            ${paramaters?.fsPath}`,
  };
};
