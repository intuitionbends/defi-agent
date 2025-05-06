import { faker } from "@faker-js/faker";
import { Pool } from "pg";
import { DatabaseService } from "../core/services/Database";
import { createLogger } from "@intuition-bends/common-js";
import { YieldSuggestion } from "../models/yield_suggestions";
import { InvestmentTimeframe, RiskTolerance } from "../types/types";
import { YieldActionBuilder } from "../core/services/YieldActionBuilder";
import { loadConfig } from "../config";
import { Chain, DataSource } from "../types/enums";

import dotenv from "dotenv";
dotenv.config();

const runSeeder = async () => {
  const logger = createLogger("seeder");

  logger.info(`load config`);
  const config = await loadConfig();
  if (config === undefined) {
    throw new Error("no config loaded");
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.connect();
    console.log("connected to postgres");
  } catch (error) {
    console.error("connect to PostgreSQL database:", error);
    throw error;
  }

  const dbService = new DatabaseService(pool, logger);
  const yaBuilder = new YieldActionBuilder(logger);

  logger.info(`connect to postgres`);

  logger.info(`load services`);

  // TODO: seed yield_suggestion_intents, yield_suggestion_intent_tx_history table
  for (let i = 1; i <= 10; i++) {
    const suggestion = getRandomYieldSuggestion(i);

    await dbService.insertYieldSuggestion(suggestion);

    const actions = await yaBuilder.buildYieldActionsBySuggestion(suggestion);

    await dbService.insertYieldActions(actions);
  }

  process.exit(0);
};

const getRandomYieldSuggestion = (id: number): YieldSuggestion => {
  return {
    id,
    timestamp: new Date(),
    insight: faker.lorem.sentence(),
    symbol: faker.string.alpha({ length: 3 }).toUpperCase(),
    isActionable: faker.datatype.boolean(),
    chain: Chain.Aptos,
    project: "amnis",
    dataSource: DataSource.Defillama,
    investmentTimeframe: faker.helpers.arrayElement([
      InvestmentTimeframe._30_DAYS,
      InvestmentTimeframe._90_DAYS,
      InvestmentTimeframe._180_DAYS,
    ]),
    riskTolerance: faker.helpers.arrayElement([
      RiskTolerance.LOW,
      RiskTolerance.MEDIUM,
      RiskTolerance.HIGH,
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

runSeeder().catch((error) => {
  console.error(error);
  process.exit(1);
});
