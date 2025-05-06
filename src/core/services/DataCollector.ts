import { scheduleAligned } from "@intuition-bends/common-js";
import winston from "winston";
import { DatabaseService } from "./Database";
import { DefiLlama } from "../../data-sources/defillama";
import { Chain } from "../../types/enums";
import { YieldActionBuilder } from "./YieldActionBuilder";

export class DataCollector {
  private dbService: DatabaseService;
  private logger: winston.Logger;
  private defillama: DefiLlama;
  private yieldActionBuilder: YieldActionBuilder;

  constructor(
    databaseService: DatabaseService,
    logger: winston.Logger,
    defillama: DefiLlama,
    yieldActionBuilder: YieldActionBuilder,
  ) {
    this.dbService = databaseService;
    this.logger = logger;
    this.defillama = defillama;
    this.yieldActionBuilder = yieldActionBuilder;
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

  async updateYieldActions() {
    let totalUpserted = 0;

    try {
      const suggestions = await this.dbService.getYieldSuggestionsLatest();

      for (const suggestion of suggestions) {
        const yieldActions =
          await this.yieldActionBuilder.buildYieldActionsBySuggestion(suggestion);

        if (!yieldActions) continue;

        const upserted = await this.dbService.insertYieldActions(yieldActions);

        this.logger.info(
          `upserted ${upserted} yield actions for suggestion #${suggestion.id} into DB`,
        );

        totalUpserted += upserted;
      }

      this.logger.info(`upserted ${totalUpserted} yield actions into DB`);
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
      `start data collector for chains ${chains.join(",")}, update pool yields every ${poolYieldInterval / 1000} seconds, 
        update defillama enriched pool every ${defillamaEnrichedPoolInterval / 1000} seconds`,
    );

    scheduleAligned(async () => {
      await this.updatePoolYields(chains);
    }, poolYieldInterval);

    scheduleAligned(async () => {
      for (const chain of chains) {
        await this.updateDefillamaEnrichedPools(chain);
      }
    }, defillamaEnrichedPoolInterval);
  }

  async runOnce(chains: Chain[]): Promise<void> {
    await this.updatePoolYields(chains);

    for (const chain of chains) {
      await this.updateDefillamaEnrichedPools(chain, 100_000, 10);
    }

    await this.updateYieldActions();
  }
}
