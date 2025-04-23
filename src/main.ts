import { Pool } from "pg";
import dotenv from "dotenv";
import { createLogger } from "@intuition-bends/common-js";
import { DataCollector } from "./core/services/dataCollector";
import { loadConfig } from "./config";
import { DatabaseService } from "./core/services/database";
import { DefiLlama } from "./data-sources/defillama";

dotenv.config();

const main = async () => {
  const logger = createLogger("defi-agent");
  logger.info("connect to postgres");

  const defillama = new DefiLlama(logger);

  const config = loadConfig();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
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
  await collector.runOnce(config.chains);
  // collector.run(config.chains, config.collectionInterval);

  process.exit(0);
};

main();
