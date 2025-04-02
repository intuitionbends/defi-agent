import axios from "axios";
import fs from "fs";
import { Pool } from "pg";
import path from "path";
import winston from "winston";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Logging Service
class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} - ${level.toUpperCase()} - ${message}`
        )
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(
            logDir,
            `collector_${new Date().toISOString().split("T")[0]}.log`
          ),
        }),
        new winston.transports.Console(),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }
  error(message: string) {
    this.logger.error(message);
  }
  warn(message: string) {
    this.logger.warn(message);
  }
}

// Config Service
class ConfigService {
  private configPath = path.join(__dirname, "../config/config.json");

  loadConfig(): any {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
      }
    } catch (error) {
      console.error(`Failed to load config: ${error}`);
    }
    return {
      protocols: (process.env.WHITE_LIST_PROTOCOLS || "aave-v3,aave-v2").split(
        ","
      ),
      tokens: (process.env.WHITE_LIST_TOKENS || "USDT,USDC").split(","),
    };
  }
}

// Database Service
// Database Service
class DatabaseService {
  private pool: Pool;
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.logger = logger;
  }

  async saveApyData(pools: any[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      this.logger.info("Saving data to PostgreSQL...");
      const currentTime = Math.floor(Date.now() / 1000);

      type ApyRecord = {
        pool_id: string;
        asset: string;
        chain: string;
        apy: number;
        tvl: number;
        timestamp: number;
        apy_base: number;
        apy_reward: number;
        apy_mean_30d: number;
        apy_change_1d: number;
        apy_change_7d: number;
        apy_change_30d: number;
        data_source: string;
      };

      const records: ApyRecord[] = pools.map((pool) => ({
        pool_id: `${pool.symbol}_${pool.chain}_${pool.project}_${
          pool.poolMeta || ""
        }`,
        asset: pool.symbol,
        chain: pool.chain,
        apy: Number(pool.apy) || 0,
        tvl: Number(pool.tvlUsd) || 0,
        timestamp: currentTime,
        apy_base: Number(pool.apyBase) || 0,
        apy_reward: Number(pool.apyReward) || 0,
        apy_mean_30d: Number(pool.apyMean30d) || 0,
        apy_change_1d: Number(pool.apyPct1D) || 0,
        apy_change_7d: Number(pool.apyPct7D) || 0,
        apy_change_30d: Number(pool.apyPct30D) || 0,
        data_source: "Defillama",
      }));

      const seen = new Set();
      const uniqueRecords = records.filter((record) => {
        const key = `${record.pool_id}_${record.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      await client.query("BEGIN");

      // Upsert history
      const historyInsertText = `
        INSERT INTO apy_history (
          pool_id, asset, chain, apy, tvl, timestamp,
          apy_base, apy_reward, apy_mean_30d,
          apy_change_1d, apy_change_7d, apy_change_30d, data_source
        ) VALUES 
        ${uniqueRecords
          .map(
            (_, i) =>
              `($${i * 13 + 1}, $${i * 13 + 2}, $${i * 13 + 3}, $${
                i * 13 + 4
              }, $${i * 13 + 5}, $${i * 13 + 6}, $${i * 13 + 7}, $${
                i * 13 + 8
              }, $${i * 13 + 9}, $${i * 13 + 10}, $${i * 13 + 11}, $${
                i * 13 + 12
              }, $${i * 13 + 13})`
          )
          .join(", ")}
        ON CONFLICT (pool_id, timestamp) DO NOTHING;
      `;

      const historyValues = uniqueRecords.flatMap((r) => [
        r.pool_id,
        r.asset,
        r.chain,
        r.apy,
        r.tvl,
        r.timestamp,
        r.apy_base,
        r.apy_reward,
        r.apy_mean_30d,
        r.apy_change_1d,
        r.apy_change_7d,
        r.apy_change_30d,
        r.data_source,
      ]);

      await client.query(historyInsertText, historyValues);

      // Upsert snapshot
      const uniqueSnapshots = Array.from(
        new Map(records.map((r) => [r.pool_id, r])).values()
      );

      for (const r of uniqueSnapshots) {
        const snapshotUpsert = `
          INSERT INTO apy_snapshot (
            pool_id, asset, chain, apy, tvl, timestamp,
            apy_base, apy_reward, apy_mean_30d,
            apy_change_1d, apy_change_7d, apy_change_30d, data_source
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13
          )
          ON CONFLICT (pool_id)
          DO UPDATE SET 
            asset = EXCLUDED.asset,
            chain = EXCLUDED.chain,
            apy = EXCLUDED.apy,
            tvl = EXCLUDED.tvl,
            timestamp = EXCLUDED.timestamp,
            apy_base = EXCLUDED.apy_base,
            apy_reward = EXCLUDED.apy_reward,
            apy_mean_30d = EXCLUDED.apy_mean_30d,
            apy_change_1d = EXCLUDED.apy_change_1d,
            apy_change_7d = EXCLUDED.apy_change_7d,
            apy_change_30d = EXCLUDED.apy_change_30d,
            data_source = EXCLUDED.data_source;
        `;

        const values = [
          r.pool_id,
          r.asset,
          r.chain,
          r.apy,
          r.tvl,
          r.timestamp,
          r.apy_base,
          r.apy_reward,
          r.apy_mean_30d,
          r.apy_change_1d,
          r.apy_change_7d,
          r.apy_change_30d,
          r.data_source,
        ];

        await client.query(snapshotUpsert, values);
      }

      await client.query("COMMIT");

      this.logger.info(
        `Saved ${uniqueRecords.length} to history and ${uniqueSnapshots.length} to snapshot.`
      );
    } catch (error: any) {
      await client.query("ROLLBACK");
      this.logger.error(
        `Failed to save data to PostgreSQL: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`
      );
    } finally {
      client.release();
    }
  }
}

// Data Collector Service
class DataCollector {
  private logger: LoggerService;
  private configService: ConfigService;
  private dbService: DatabaseService;

  constructor() {
    this.logger = new LoggerService();
    this.configService = new ConfigService();
    this.dbService = new DatabaseService(this.logger);
  }

  async fetchPools(): Promise<any[]> {
    try {
      this.logger.info("Fetching pools from DeFiLlama API...");
      const response = await axios.get("https://yields.llama.fi/pools");
      const data = response.data?.data || [];

      this.logger.info(`Fetched ${data.length} pools.`);
      const config = this.configService.loadConfig();

      const filteredPools = data.filter(
        (pool: any) => pool.chain.toLowerCase() === "aptos"
      ); // to filter based on config: config.tokens.includes(pool.symbol) &&
      this.logger.info(`Filtered to ${filteredPools.length} relevant pools.`);

      filteredPools.forEach(
        (pool: {
          symbol: string;
          chain: string;
          project: string;
          apy: number;
          tvlUsd: number;
        }) => {
          this.logger.info(
            `Pool: ${pool.symbol}, Chain: ${pool.chain}, Project: ${
              pool.project
            }, APY: ${pool.apy.toFixed(
              2
            )}%, TVL: $${pool.tvlUsd.toLocaleString()}`
          );
        }
      );

      return filteredPools;
    } catch (error) {
      this.logger.error(`Error fetching pool data: ${error}`);
      return [];
    }
  }

  async runDataCollection(): Promise<void> {
    try {
      const pools = await this.fetchPools();
      if (pools.length > 0) {
        await this.dbService.saveApyData(pools);
      } else {
        this.logger.warn("No data fetched, skipping save.");
      }
    } catch (error) {
      this.logger.error(`Critical error in data collection: ${error}`);
    }
  }
}

// Start Process
const COLLECTION_INTERVAL = parseInt(
  process.env.COLLECTION_INTERVAL || "300",
  10
);
const collector = new DataCollector();

if (require.main === module) {
  console.log("Starting data collection...");
  collector.runDataCollection();
  setInterval(() => collector.runDataCollection(), COLLECTION_INTERVAL * 1000);
}
