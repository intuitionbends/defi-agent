import { scheduleAligned } from "@intuition-bends/common-js";
import winston from "winston";
import { DatabaseService } from "./Database";
import { DefiLlama } from "../../data-sources/defillama";
import { Chain } from "../../types/enums";
import { Pool } from "pg";

export class DataCollector {
  private dbService: DatabaseService;
  private logger: winston.Logger;
  private defillama: DefiLlama;

  constructor(databaseService: DatabaseService, logger: winston.Logger, defillama: DefiLlama) {
    this.dbService = databaseService;
    this.logger = logger;
    this.defillama = defillama;
  }

  async runOnce(chains: Chain[]): Promise<void> {
    try {
      const yields = await this.defillama.getPoolYields(chains);
      const upserted = await this.dbService.upsertPoolYields(yields);

      this.logger.info(`upserted ${upserted} APY history into DB`);
    } catch (error) {
      this.logger.error(`run: ${error}`);
    }
  }

  run(chains: Chain[], interval: number): void {
    console.log(`run data collector every ${interval / 1000} seconds`);

    scheduleAligned(async () => {
      await this.runOnce(chains);
    }, interval);
  }
}

if (require.main === module) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console()
    ]
  });

  const databaseService = new DatabaseService(pool, logger);
  const defillama = new DefiLlama(logger);

  const collector = new DataCollector(databaseService, logger, defillama);

  const chains: Chain[] = [Chain.Aptos]; 
  const interval = 60 * 1000; 

  collector.run(chains, interval);
}