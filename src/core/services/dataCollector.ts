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
      this.logger.info("Saving data to `pool_yields` table...");
      const currentTime = new Date().toISOString();
  
      const recordMap = new Map<string, any>(); //dedupe records
  
      for (const pool of pools) {
        const original_id = `${pool.symbol}_${pool.chain}_${pool.project}_${pool.poolMeta || ""}`;
        const key = `${original_id}_1`; // data_source is fixed to 1
  
        const record = {
          original_id,
          data_source: 1,
          chain: pool.chain,
          symbol: pool.symbol,
          project: pool.project,
          apy: Number(pool.apy) || 0,
          apy_base: Number(pool.apyBase) || 0,
          apy_base_7d: null,
          apy_mean_30d: Number(pool.apyMean30d) || 0,
          apy_pct_1d: Number(pool.apyPct1D) || 0,
          apy_pct_7d: Number(pool.apyPct7D) || 0,
          apy_pct_30d: Number(pool.apyPct30D) || 0,
          tvl_usd: Number(pool.tvlUsd) || 0,
          created_at: currentTime,
          updated_at: currentTime,
        };
  
        recordMap.set(key, record); // will overwrite duplicate keys
      }
  
      const newRecords = Array.from(recordMap.values());
  
      const placeholders = newRecords.map((_, i) => {
        const offset = i * 15;
        return `(${Array.from({ length: 15 }, (_, j) => `$${offset + j + 1}`).join(", ")})`;
      }).join(", ");
  
      const insertQuery = `
        INSERT INTO pool_yields (
          original_id, data_source, chain, symbol, project,
          apy, apy_base, apy_base_7d, apy_mean_30d,
          apy_pct_1d, apy_pct_7d, apy_pct_30d,
          tvl_usd, created_at, updated_at
        )
        VALUES ${placeholders}
        ON CONFLICT (original_id, data_source) DO UPDATE SET
          apy = EXCLUDED.apy,
          apy_base = EXCLUDED.apy_base,
          apy_base_7d = EXCLUDED.apy_base_7d,
          apy_mean_30d = EXCLUDED.apy_mean_30d,
          apy_pct_1d = EXCLUDED.apy_pct_1d,
          apy_pct_7d = EXCLUDED.apy_pct_7d,
          apy_pct_30d = EXCLUDED.apy_pct_30d,
          tvl_usd = EXCLUDED.tvl_usd,
          updated_at = EXCLUDED.updated_at;
      `;
  
      const values = newRecords.flatMap(r => [
        r.original_id, r.data_source, r.chain, r.symbol, r.project,
        r.apy, r.apy_base, r.apy_base_7d, r.apy_mean_30d,
        r.apy_pct_1d, r.apy_pct_7d, r.apy_pct_30d,
        r.tvl_usd, r.created_at, r.updated_at,
      ]);
  
      await client.query("BEGIN");
      await client.query(insertQuery, values);
      await client.query("COMMIT");
  
      this.logger.info(`Saved ${newRecords.length} records to pool_yields.`);
    } catch (error: any) {
      await client.query("ROLLBACK");
      this.logger.error(`Failed to save to pool_yields: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
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
