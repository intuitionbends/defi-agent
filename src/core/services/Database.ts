import { Pool } from "pg";
import winston from "winston";
import {
  anyToAvailableInteraction,
  anyToPoolYield,
  AvailableInteraction,
  PoolYield,
} from "../../types/types";
import { Chain } from "../../types/enums";

export class DatabaseService {
  private pool: Pool;
  private logger: winston.Logger;

  constructor(pool: Pool, logger: winston.Logger) {
    this.pool = pool;
    this.logger = logger;
  }

  async getAvailableInteractions(chain: Chain = Chain.Aptos): Promise<AvailableInteraction[]> {
    const result = await this.pool.query(
      `SELECT chain, project, name, args FROM available_interactions WHERE chain = $1`,
      [chain],
    );

    return result.rows.map(anyToAvailableInteraction);
  }

  async getAvailableInteractionsByProject(
    chain: Chain = Chain.Aptos,
    project: string,
  ): Promise<AvailableInteraction[]> {
    const result = await this.pool.query(
      `SELECT chain, project, name, args FROM available_interactions WHERE chain = $1 AND project = $2`,
      [chain, project],
    );

    console.log("Available interactions:", result.rows);

    return result.rows.map(anyToAvailableInteraction);
  }

  async upsertAvailableInteractions(interactions: AvailableInteraction[]): Promise<number> {
    if (interactions.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `
        INSERT INTO available_interactions (chain, project, name, args) VALUES
        ${interactions
          .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3})`)
          .join(", ")}
        ON CONFLICT (chain, project, name) DO UPDATE SET
          args = EXCLUDED.args,
          updated_at = NOW()
      `,
      interactions.map((i) => [i.chain, i.project, i.name, i.args]).flat(),
    );

    return result.rowCount || 0;

  }

  async getTopAPYPoolYields(
    chain: Chain = Chain.Aptos,
    minTvlUsd = 100_000,
    limit = 5,
  ): Promise<PoolYield[]> {
    const result = await this.pool.query(
      `SELECT original_id, data_source, chain, symbol, project, apy, apy_base, apy_base_7d, 
              apy_mean_30d, apy_pct_1d, apy_pct_7d, apy_pct_30d, tvl_usd 
       FROM pool_yields 
       WHERE LOWER(chain) = LOWER($1) 
         AND apy > 0 
         AND tvl_usd > $2 
       ORDER BY apy DESC 
       LIMIT $3`,
      [chain, minTvlUsd, limit],
    );
    return result.rows.map(anyToPoolYield);
  }

  async getAverageApy(): Promise<number | null> {
    const { rows } = await this.pool.query(`
      SELECT AVG(apy) as avg_apy
      FROM pool_yields
      WHERE chain = 'aptos'
    `);
    return rows[0]?.avg_apy || null;
  }

  async getTotalTvl(): Promise<number | null> {
    const { rows } = await this.pool.query(`
      SELECT SUM(tvl_usd) as total_tvl
      FROM pool_yields
      WHERE chain = 'aptos'
    `);
    return rows[0]?.total_tvl || null;
  }

  async getBestPoolYieldByAsset(chain: Chain = Chain.Aptos): Promise<PoolYield[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT ON (symbol) 
      original_id, data_source, chain, symbol, project, apy, apy_base, apy_base_7d, apy_mean_30d, apy_pct_1d, apy_pct_7d, apy_pct_30d, tvl_usd
      FROM pool_yields
      WHERE chain = $1 AND apy > 0
      ORDER BY symbol, apy DESC`,
      [chain],
    );

    return result.rows.map(anyToPoolYield);
  }

  async upsertPoolYields(poolYields: PoolYield[]): Promise<number> {
    if (poolYields.length === 0) {
      return 0;
    }

    // TODO: add tx wrapper
    try {
      const result = await this.pool.query(
        `
        INSERT INTO pool_yields (
          original_id,
          data_source,
          chain,
          symbol,
          project,
          apy,
          apy_base,
          apy_base_7d,
          apy_mean_30d,
          apy_pct_1d,
          apy_pct_7d,
          apy_pct_30d,
          tvl_usd
        ) VALUES 
        ${poolYields
          .map(
            (_, i) =>
              `($${i * 13 + 1}, $${i * 13 + 2}, $${i * 13 + 3}, $${i * 13 + 4}, $${i * 13 + 5}, $${
                i * 13 + 6
              }, $${i * 13 + 7}, $${i * 13 + 8}, $${i * 13 + 9}, $${i * 13 + 10}, $${
                i * 13 + 11
              }, $${i * 13 + 12}, $${i * 13 + 13})`,
          )
          .join(", ")}
        ON CONFLICT (original_id, data_source) DO UPDATE SET 
          chain = EXCLUDED.chain,
          symbol = EXCLUDED.symbol,
          project = EXCLUDED.project,
          apy = EXCLUDED.apy,
          apy_base = EXCLUDED.apy_base,
          apy_base_7d = EXCLUDED.apy_base_7d,
          apy_mean_30d = EXCLUDED.apy_mean_30d,
          apy_pct_1d = EXCLUDED.apy_pct_1d,
          apy_pct_7d = EXCLUDED.apy_pct_7d,
          apy_pct_30d = EXCLUDED.apy_pct_30d,
          tvl_usd = EXCLUDED.tvl_usd,
          updated_at = NOW()
      `,
        poolYields
          .map((y) => [
            y.originalId,
            y.dataSource,
            y.chain,
            y.symbol,
            y.project,
            y.apy,
            y.apyBase,
            y.apyBase7d,
            y.apyMean30d,
            y.apyPct1d,
            y.apyPct7d,
            y.apyPct30d,
            y.tvlUsd,
          ])
          .flat(),
      );
      return result.rowCount || 0;
    } catch (error: any) {
      this.logger.error(
        `save pool yields to DB: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );

      return 0;
    }
  }
}