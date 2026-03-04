import dotenv from "dotenv";
dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  dbPath: string;
  openaiApiKey: string | undefined;
  anthropicApiKey: string | undefined;
  allowedHttpDomains: string[];
  transformTimeoutMs: number;
  httpRequestTimeoutMs: number;
}

const config: Config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  dbPath: process.env.DB_PATH ?? "workflows.db",
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  allowedHttpDomains: process.env.ALLOWED_HTTP_DOMAINS?.split(",") ?? ["*"],
  transformTimeoutMs: parseInt(process.env.TRANSFORM_TIMEOUT_MS ?? "5000", 10),
  httpRequestTimeoutMs: parseInt(
    process.env.HTTP_REQUEST_TIMEOUT_MS ?? "10000",
    10,
  ),
};

export default config;
