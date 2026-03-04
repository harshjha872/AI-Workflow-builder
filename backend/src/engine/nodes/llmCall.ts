import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ExecutionContext } from "../context.js";
import { interpolate } from "../interpolate.js";
import config from "../../config.js";

export interface LLMCallConfig {
  provider: "openai" | "anthropic";
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

export async function execute(
  config: LLMCallConfig,
  context: ExecutionContext,
): Promise<Record<string, unknown>> {
  const systemPrompt = interpolate(config.systemPrompt, context.data);
  const userPrompt = interpolate(config.userPrompt, context.data);
  const maxTokens = config.maxTokens ?? 1024;
  const temperature = config.temperature ?? 0.7;

  let responseText: string;

  if (config.provider === "openai") {
    responseText = await callOpenAI(
      systemPrompt,
      userPrompt,
      config.model,
      maxTokens,
      temperature,
    );
  } else {
    responseText = await callAnthropic(
      systemPrompt,
      userPrompt,
      config.model,
      maxTokens,
      temperature,
    );
  }

  return { [config.outputKey]: responseText };
}
