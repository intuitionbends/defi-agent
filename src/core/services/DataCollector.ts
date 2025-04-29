import { scheduleAligned } from "@intuition-bends/common-js";
import winston from "winston";
import { DatabaseService } from "./Database";
import { DefiLlama } from "../../data-sources/defillama";
import { Chain } from "../../types/enums";

export class DataCollector {
  private dbService: DatabaseService;
  private logger: winston.Logger;
  private defillama: DefiLlama;

  constructor(databaseService: DatabaseService, logger: winston.Logger, defillama: DefiLlama) {
    this.dbService = databaseService;
    this.logger = logger;
    this.defillama = defillama;
  }

  async updatePoolYields(chains: Chain[]): Promise<void> {
    try {
      const yields = await this.defillama.getPoolYields(chains);
      const upserted = await this.dbService.upsertPoolYields(yields);

      this.logger.info(`upserted ${upserted} APY history into DB`);
    } catch (error) {
      this.logger.error(`run: ${error}`);
    }
  }

  async updateDefillamaEnrichedPools(chain: Chain, min_tvl = 100_000, limit = 10): Promise<void> {
    try {
      const poolYields = await this.dbService.getTopAPYPoolYields(chain, min_tvl, limit);

      const enrichedPools = await Promise.all(
        poolYields.map((y) => this.defillama.getEnrichedPool(y.originalId)),
      );

      const upserted = await this.dbService.upsertDefillamaEnrichedPools(
        enrichedPools.filter((pool) => pool !== null),
      );

      this.logger.info(`upserted ${upserted} enriched pools into DB`);
    } catch (error) {
      this.logger.error(`run: ${error}`);
    }
  }

  async run(
    chains: Chain[],
    poolYieldInterval: number,
    defillamaEnrichedPoolInterval = 24 * 60 * 60 * 1000, // 1 day in milliseconds
  ): Promise<void> {
    this.logger.info(
      `start data collector for chains: ${chains.join(",")}, scrape every ${poolYieldInterval / 1000} seconds`,
    );

    scheduleAligned(async () => {
      await this.updatePoolYields(chains);
    }, poolYieldInterval);

    await this.updatePoolYields([Chain.Aptos]);
    await this.updateDefillamaEnrichedPools(Chain.Aptos, 100_000, 7);

    scheduleAligned(async () => {
      await this.updateDefillamaEnrichedPools(Chain.Aptos);
    }, defillamaEnrichedPoolInterval);
  }
}
