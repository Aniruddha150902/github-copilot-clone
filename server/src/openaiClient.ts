import * as path from "path";
import * as dotenv from "dotenv";
import { AzureChatOpenAI } from "@langchain/openai";

const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

export const model = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_CHAT_MODEL,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT_GPT35,
});
