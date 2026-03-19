import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { ExecutionContext } from "../context.js";
import { interpolate } from "../interpolate.js";
import config from "../../config.js";

export interface LLMCallConfig {
  provider: "openai" | "anthropic" | "gemini";
  model: string;
  systemPrompt: string;
  userPrompt: string;
  outputKey: string;
  maxTokens?: number;
  temperature?: number;
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      temperature,
    },
  });
  return response.text ?? "";
}

export async function execute(
  config: LLMCallConfig,
  context: any,
): Promise<Record<string, unknown>> {
  const systemPrompt = interpolate(config.systemPrompt, context.data);
  const userPrompt = interpolate(config.userPrompt, context.data);
  const maxTokens = config.maxTokens ?? 1024;
  const temperature = config.temperature ?? 0.7;

  let responseText: string;

  switch (config.provider) {
    case "openai":
      responseText = await callOpenAI(
        systemPrompt, userPrompt, config.model, maxTokens, temperature,
      );
      break;
    case "anthropic":
      responseText = await callAnthropic(
        systemPrompt, userPrompt, config.model, maxTokens, temperature,
      );
      break;
    case "gemini":
      responseText = await callGemini(
        systemPrompt, userPrompt, config.model, maxTokens, temperature,
      );
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return { [config.outputKey]: responseText };
}
