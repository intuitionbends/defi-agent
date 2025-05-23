import { Pool } from "pg";
import { createLogger } from "@intuition-bends/common-js";
import { DataCollector } from "./core/services/DataCollector";
import { loadConfig } from "./config";
import { DatabaseService } from "./core/services/Database";
import { DefiLlama } from "./data-sources/defillama";
import express from "express";
import { createApiV1Router } from "./routes/api";
import defaultRouter from "./routes/default";
import { YieldActionBuilder } from "./core/services/YieldActionBuilder";
import { TransactionBuilderAdapter } from "./core/services/TransactionBuilderAdapter";

import dotenv from "dotenv";
dotenv.config();

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
  const yieldActionBuilder = new YieldActionBuilder(logger);
  const txBuilder = new TransactionBuilderAdapter(logger);

  logger.info("start data collector");

  const collector = new DataCollector(dbService, logger, defillama, yieldActionBuilder);
  // await collector.run(config.chains, config.collectionInterval);
  await collector.runOnce(config.chains);

  const app = express();
  app.use(express.json());

  app.use("", defaultRouter);
  app.use("/api/v1", createApiV1Router(dbService, txBuilder));

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
