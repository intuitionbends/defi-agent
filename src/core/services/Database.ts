import { Pool } from "pg";
import winston from "winston";
import {
  anyToAvailableInteraction,
  anyToPoolYield,
  AvailableInteraction,
  PoolYield,
  RiskTolerance,
} from "../../types/types";
import { Chain, DataSource } from "../../types/enums";
import { DefillamaEnrichedPool } from "../../data-sources/defillama";
import { YieldSuggestion } from "../../models/yield_suggestions";
import { YieldSuggestionIntent } from "../../models/yield_suggestion_intent";
import {
  TransactionStatus,
  YieldSuggestionIntentTxHistory,
} from "../../models/yield_suggestion_intent_tx_history";
import { YieldAction } from "../../models/yield_actions";

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

    return result.rows.map(anyToAvailableInteraction);
  }

  async upsertAvailableInteractions(interactions: AvailableInteraction[]): Promise<number> {
    if (interactions.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `
        INSERT INTO available_interactions (chain, project, name, args) VALUES
        ${interactions.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3})`).join(", ")}
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
       WHERE chain = $1 
         AND apy > 0 
         AND tvl_usd > $2 
       ORDER BY apy DESC 
       LIMIT $3`,
      [chain, minTvlUsd, limit],
    );

    return result.rows.map(anyToPoolYield);
  }

  async getQualifiedPoolYields(
    chain: Chain = Chain.Aptos,
    riskTolerance: RiskTolerance,
    maxDrawdown: number, // TODO: refine methodology
    asset: string,
    assetValueUsd: number,
    investmentTimeframe: number, // TODO: refine methodology
    limit = 5,
  ): Promise<PoolYield[]> {
    let maxSigma: number;
    switch (riskTolerance) {
      case RiskTolerance.LOW:
        maxSigma = 0.15;
        break;
      case RiskTolerance.MEDIUM:
        maxSigma = 0.5;
        break;
      case RiskTolerance.HIGH:
        maxSigma = 5;
        break;
      default:
        throw new Error("invalid risk tolerance");
    }

    const result = await this.pool.query(
      `SELECT y.original_id, y.data_source, y.chain, y.symbol, y.project, y.apy, y.apy_base, y.apy_base_7d, 
              y.apy_mean_30d, y.apy_pct_1d, y.apy_pct_7d, y.apy_pct_30d, y.tvl_usd 
       FROM pool_yields y
       JOIN defillama_enriched_pools p
       ON y.original_id = p.pool
       WHERE y.chain = $1 
         AND p.sigma < $2
         AND y.symbol LIKE '%' || $3 || '%'
         AND y.tvl_usd > $4
         AND y.data_source = $5
       ORDER BY y.apy DESC 
       LIMIT $6`,
      [chain, maxSigma, asset, assetValueUsd * 100, DataSource.Defillama, limit],
    );

    return result.rows.map(anyToPoolYield);
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

  async upsertDefillamaEnrichedPools(enrichedPools: DefillamaEnrichedPool[]): Promise<number> {
    if (enrichedPools.length === 0) {
      return 0;
    }

    try {
      const result = await this.pool.query(
        `
        INSERT INTO defillama_enriched_pools (
          pool,
          timestamp,
          project,
          chain,
          symbol,
          pool_meta,
          underlying_tokens,
          reward_tokens,
          tvl_usd,
          apy,
          apy_base,
          apy_reward,
          il_7d,
          apy_base_7d,
          volume_usd_1d,
          volume_usd_7d,
          apy_base_inception,
          url,
          apy_pct_1d,
          apy_pct_7d,
          apy_pct_30d,
          apy_mean_30d,
          stablecoin,
          il_risk,
          exposure,
          return_value,
          count,
          apy_mean_expanding,
          apy_std_expanding,
          mu,
          sigma,
          outlier,
          project_factorized,
          chain_factorized,
          predicted_class,
          predicted_probability,
          binned_confidence,
          pool_old
        ) VALUES 
        ${enrichedPools
          .map(
            (_, i) =>
              `($${i * 38 + 1}, $${i * 38 + 2}, $${i * 38 + 3}, $${i * 38 + 4}, $${i * 38 + 5}, $${
                i * 38 + 6
              }, $${i * 38 + 7}, $${i * 38 + 8}, $${i * 38 + 9}, $${i * 38 + 10}, $${
                i * 38 + 11
              }, $${i * 38 + 12}, $${i * 38 + 13}, $${i * 38 + 14}, $${i * 38 + 15}, $${
                i * 38 + 16
              }, $${i * 38 + 17}, $${i * 38 + 18}, $${i * 38 + 19}, $${i * 38 + 20}, $${
                i * 38 + 21
              }, $${i * 38 + 22}, $${i * 38 + 23}, $${i * 38 + 24}, $${i * 38 + 25}, $${
                i * 38 + 26
              }, $${i * 38 + 27}, $${i * 38 + 28}, $${i * 38 + 29}, $${i * 38 + 30}, $${
                i * 38 + 31
              }, $${i * 38 + 32}, $${i * 38 + 33}, $${i * 38 + 34}, $${i * 38 + 35}, $${
                i * 38 + 36
              }, $${i * 38 + 37}, $${i * 38 + 38})`,
          )
          .join(", ")}
        ON CONFLICT (pool) DO UPDATE SET 
          timestamp = EXCLUDED.timestamp,
          project = EXCLUDED.project,
          chain = EXCLUDED.chain,
          symbol = EXCLUDED.symbol,
          pool_meta = EXCLUDED.pool_meta,
          underlying_tokens = EXCLUDED.underlying_tokens,
          reward_tokens = EXCLUDED.reward_tokens,
          tvl_usd = EXCLUDED.tvl_usd,
          apy = EXCLUDED.apy,
          apy_base = EXCLUDED.apy_base,
          apy_reward = EXCLUDED.apy_reward,
          il_7d = EXCLUDED.il_7d,
          apy_base_7d = EXCLUDED.apy_base_7d,
          volume_usd_1d = EXCLUDED.volume_usd_1d,
          volume_usd_7d = EXCLUDED.volume_usd_7d,
          apy_base_inception = EXCLUDED.apy_base_inception,
          url = EXCLUDED.url,
          apy_pct_1d = EXCLUDED.apy_pct_1d,
          apy_pct_7d = EXCLUDED.apy_pct_7d,
          apy_pct_30d = EXCLUDED.apy_pct_30d,
          apy_mean_30d = EXCLUDED.apy_mean_30d,
          stablecoin = EXCLUDED.stablecoin,
          il_risk = EXCLUDED.il_risk,
          exposure = EXCLUDED.exposure,
          return_value = EXCLUDED.return_value,
          count = EXCLUDED.count,
          apy_mean_expanding = EXCLUDED.apy_mean_expanding,
          apy_std_expanding = EXCLUDED.apy_std_expanding,
          mu = EXCLUDED.mu,
          sigma = EXCLUDED.sigma,
          outlier = EXCLUDED.outlier,
          project_factorized = EXCLUDED.project_factorized,
          chain_factorized = EXCLUDED.chain_factorized,
          predicted_class = EXCLUDED.predicted_class,
          predicted_probability = EXCLUDED.predicted_probability,
          binned_confidence = EXCLUDED.binned_confidence,
          pool_old = EXCLUDED.pool_old,
          updated_at = NOW()
        `,
        enrichedPools
          .map((p) => [
            p.pool,
            p.timestamp || new Date(),
            p.project,
            p.chain,
            p.symbol,
            p.poolMeta,
            p.underlyingTokens,
            p.rewardTokens || null,
            p.tvlUsd,
            p.apy,
            p.apyBase || null,
            p.apyReward || null,
            p.il7d || null,
            p.apyBase7d || null,
            p.volumeUsd1d || null,
            p.volumeUsd7d || null,
            p.apyBaseInception || null,
            p.url,
            p.apyPct1d || null,
            p.apyPct7d || null,
            p.apyPct30d || null,
            p.apyMean30d || null,
            p.stablecoin,
            p.ilRisk,
            p.exposure,
            p.returnValue || null,
            p.count || null,
            p.apyMeanExpanding || null,
            p.apyStdExpanding || null,
            p.mu || null,
            p.sigma || null,
            p.outlier || null,
            p.projectFactorized || null,
            p.chainFactorized || null,
            p.predictedClass || null,
            p.predictedProbability || null,
            p.binnedConfidence || null,
            p.poolOld || null,
          ])
          .flat(),
      );
      return result.rowCount || 0;
    } catch (error: any) {
      this.logger.error(
        `save defillama enriched pools to DB: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );

      return 0;
    }
  }

  async getYieldSuggestionsLatest(lookback = 30 * 24 * 60 * 60 * 1000): Promise<YieldSuggestion[]> {
    const lookbackDate = new Date(Date.now() - lookback);

    const result = await this.pool.query(
      `SELECT * FROM (
      SELECT *, 
           ROW_NUMBER() OVER (PARTITION BY symbol, risk_tolerance, investment_timeframe 
                   ORDER BY timestamp DESC) as row_num
      FROM yield_suggestions 
      WHERE timestamp >= $1
      ) ranked
      WHERE row_num = 1
      ORDER BY symbol, risk_tolerance, investment_timeframe DESC`,
      [lookbackDate],
    );

    return result.rows.map(dataToYieldSuggestion);
  }

  async getYieldSuggestions(): Promise<YieldSuggestion[]> {
    const result = await this.pool.query(`SELECT * FROM yield_suggestions`);

    return result.rows.map(dataToYieldSuggestion);
  }

  async getYieldActionsBySuggestionId(suggestionId: number): Promise<YieldAction[]> {
    const result = await this.pool.query(
      `SELECT * FROM yield_actions WHERE yield_suggestion_id = $1`,
      [suggestionId],
    );

    return result.rows.map(dataToYieldAction);
  }

  async getYieldSuggestion(id: number): Promise<YieldSuggestion | null> {
    const result = await this.pool.query(`SELECT * FROM yield_suggestions WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return null;
    }

    return dataToYieldSuggestion(result.rows[0]);
  }

  async getYieldSuggestionIntentsByWalletAddress(
    walletAddress: string,
    limit = 10,
  ): Promise<YieldSuggestionIntent[] | null> {
    const result = await this.pool.query(
      `SELECT * FROM yield_suggestion_intents WHERE wallet_address = $1 LIMIT $2`,
      [walletAddress, limit],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows.map(dataToYieldSuggestionIntent);
  }

  async createYieldSuggestionIntent(
    suggestion: YieldSuggestion,
    walletAddress: string,
    amount: number,
  ): Promise<YieldSuggestionIntent> {
    const result = await this.pool.query(
      `
        INSERT INTO yield_suggestion_intents (wallet_address, yield_suggestion_id, asset_amount) VALUES
        ($1, $2, $3)
        RETURNING id, wallet_address, yield_suggestion_id, asset_amount, status
      `,
      [walletAddress, suggestion.id, amount],
    );

    if (result.rowCount === 0) {
      throw new Error("create yield action intent");
    }

    return dataToYieldSuggestionIntent(result.rows[0]);
  }

  async getYieldSuggestionIntent(id: number): Promise<YieldSuggestionIntent | null> {
    const result = await this.pool.query(`SELECT * FROM yield_suggestion_intents WHERE id = $1`, [
      id,
    ]);

    if (result.rowCount === 0) {
      return null;
    }

    return dataToYieldSuggestionIntent(result.rows[0]);
  }

  async insertYieldSuggestion(suggestion: YieldSuggestion): Promise<YieldSuggestion> {
    const result = await this.pool.query(
      `
        INSERT INTO yield_suggestions (timestamp, insight, is_actionable, symbol, investment_timeframe, risk_tolerance) VALUES
        ($1, $2, $3, $4, $5, $6)
        RETURNING id, timestamp, insight, is_actionable, symbol, investment_timeframe, risk_tolerance
      `,
      [
        suggestion.timestamp,
        suggestion.insight,
        suggestion.isActionable,
        suggestion.symbol,
        suggestion.investmentTimeframe,
        suggestion.riskTolerance,
      ],
    );

    if (result.rowCount === 0) {
      throw new Error("Failed to create yield action");
    }

    return dataToYieldSuggestion(result.rows[0]);
  }

  async getYieldSuggestionIntentTxHistoryByWalletAddress(
    walletAddress: string,
  ): Promise<YieldSuggestionIntentTxHistory[]> {
    const result = await this.pool.query(
      `SELECT * FROM yield_suggestion_intent_tx_history WHERE wallet_address = $1`,
      [walletAddress],
    );

    if (result.rowCount === 0) {
      return [];
    }

    return result.rows.map(dataToYieldSuggestionIntentTxHistory);
  }

  async getYieldSuggestionIntentCurrentSequenceNumber(
    intent: YieldSuggestionIntent,
  ): Promise<number> {
    const result = await this.pool.query(
      `SELECT MAX(sequence_number) as sequence_number FROM yield_suggestion_intent_tx_history WHERE wallet_address = $1 AND yield_suggestion_intent_id = $2`,
      [intent.walletAddress, intent.id],
    );

    if (result.rowCount === 0) {
      return 0;
    }

    return result.rows[0].sequence_number + 1;
  }

  async insertYieldSuggestionIntentTxHistory(
    yieldSuggestionIntent: YieldSuggestionIntent,
    sequenceNumber: number,
    hash: string,
    status: TransactionStatus,
  ): Promise<YieldSuggestionIntentTxHistory> {
    const result = await this.pool.query(
      `
        INSERT INTO yield_suggestion_intent_tx_history (wallet_address, yield_suggestion_id, yield_suggestion_intent_id, sequence_number, tx_hash, tx_status) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, wallet_address, yield_suggestion_id, yield_suggestion_intent_id, sequence_number, tx_hash, tx_status
      `,
      [
        yieldSuggestionIntent.walletAddress,
        yieldSuggestionIntent.suggestionId,
        yieldSuggestionIntent.id,
        sequenceNumber,
        hash,
        status,
      ],
    );

    if (result.rowCount === 0) {
      throw new Error("Failed to create yield action intent tx history");
    }

    return dataToYieldSuggestionIntentTxHistory(result.rows[0]);
  }

  async insertYieldActions(actions: YieldAction[] | null): Promise<number> {
    if (actions === null) {
      return 0;
    }

    if (actions.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `
      INSERT INTO yield_actions (yield_suggestion_id, sequence_number, title, description, action_type) VALUES
      ${actions.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(", ")}
      `,
      actions
        .map((a) => [a.suggestionId, a.sequenceNumber, a.title, a.description, a.actionType])
        .flat(),
    );

    return result.rowCount || 0;
  }
}

const dataToYieldSuggestion = (data: any): YieldSuggestion => {
  return {
    id: data.id,
    timestamp: data.timestamp,
    symbol: data.symbol,
    investmentTimeframe: data.investment_timeframe,
    riskTolerance: data.risk_tolerance,
    dataSource: data.data_source,
    chain: data.chain,
    project: data.project,
    insight: data.insight,
    isActionable: data.is_actionable,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

const dataToYieldAction = (data: any): YieldAction => {
  return {
    suggestionId: data.yield_suggestion_id,
    sequenceNumber: data.sequence_number,
    title: data.title,
    description: data.description,
    actionType: data.action_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

const dataToYieldSuggestionIntent = (data: any): YieldSuggestionIntent => {
  return {
    id: data.id,
    walletAddress: data.wallet_address,
    suggestionId: data.yield_suggestion_id,
    suggestion: data.suggestion,
    assetAmount: data.asset_amount,
    status: data.status,
    txHistory: data.tx_history,
  };
};

const dataToYieldSuggestionIntentTxHistory = (data: any): YieldSuggestionIntentTxHistory => {
  return {
    walletAddress: data.wallet_address,
    suggestion: data.suggestion,
    sequence_number: data.sequence_number,
    txHash: data.tx_hash,
    txStatus: data.tx_status,
  };
};
