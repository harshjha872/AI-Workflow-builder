import express from "express";
import cors from "cors";
import workflowRoutes from "./routes/workflows.js";
import executionRoutes from "./routes/executions.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { getExecutionsByWorkflowId } from "./db/queries/executions.js";
import db from "./db/client.js";

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(requestLoggerMiddleware);

  app.get("/api/health", (_req, res) => {
    let dbConnected = false;
    try {
      db.prepare("SELECT 1").get();
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    res.json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      dbConnected,
    });
  });

  app.use("/api/workflows", workflowRoutes);
  app.use("/api/executions", executionRoutes);

  app.get("/api/workflows/:workflowId/executions", (_req, res) => {
    const executions = getExecutionsByWorkflowId(_req.params.workflowId);
    res.json(executions);
  });

  app.use(errorHandler);

  return app;
}
