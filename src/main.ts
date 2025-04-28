import { Pool } from "pg";

import dotenv from "dotenv";
dotenv.config();

import { createLogger } from "@intuition-bends/common-js";
import { DataCollector } from "./core/services/DataCollector";
import { loadConfig } from "./config";
import { DatabaseService } from "./core/services/Database";
import { DefiLlama } from "./data-sources/defillama";

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
  collector.run(config.chains, config.collectionInterval);

  await new Promise(() => {});

  process.exit(0);
};

main();
