import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

export const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
