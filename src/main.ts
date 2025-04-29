import { Pool } from "pg";
import bodyParser from "body-parser";

import dotenv from "dotenv";
dotenv.config();

import { createLogger } from "@intuition-bends/common-js";
import { DataCollector } from "./core/services/DataCollector";
import { loadConfig } from "./config";
import { DatabaseService } from "./core/services/Database";
import { DefiLlama } from "./data-sources/defillama";
import express from "express";
import { createApiV1Router } from "./routes/api";
import defaultRouter from "./routes/default";

export const app = express();
app.use(bodyParser.json());

const main = async () => {
  const logger = createLogger("defi-agent");
  logger.info("connect to postgres");

  const defillama = new DefiLlama(logger);

  const config = loadConfig();

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.env === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.connect();
    logger.info("connected to postgres");
  } catch (error) {
    logger.error("connect to postgres:", error);
    process.exit(1);
  }

  const dbService = new DatabaseService(pool, logger);

  logger.info("start data collector");

  const collector = new DataCollector(dbService, logger, defillama);
  await collector.run(config.chains, config.collectionInterval);

  const app = express();

  app.use("", defaultRouter);
  app.use("/api/v1", createApiV1Router(dbService));

  const server = app.listen(config.port, () => {
    logger.info(`listening on port ${config.port}`);
  });

  await new Promise((resolve) => {
    process.on("SIGINT", () => {
      logger.info("received SIGINT, shutting down");
      server.close(() => {
        resolve(true);
      });
    });
  });

  process.exit(0);
};

main();
