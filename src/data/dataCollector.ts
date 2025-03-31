import axios from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

// Logging Service
class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)
      ),
      transports: [
        new winston.transports.File({ filename: path.join(logDir, `collector_${new Date().toISOString().split('T')[0]}.log`) }),
        new winston.transports.Console(),
      ],
    });
  }

  info(message: string) { this.logger.info(message); }
  error(message: string) { this.logger.error(message); }
  warn(message: string) { this.logger.warn(message); }
}

// Config Service
class ConfigService {
  private configPath = path.join(__dirname, '../config/config.json');

  loadConfig(): any {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
    } catch (error) {
      console.error(`Failed to load config: ${error}`);
    }
    return {
      protocols: (process.env.WHITE_LIST_PROTOCOLS || 'aave-v3,aave-v2').split(','),
      tokens: (process.env.WHITE_LIST_TOKENS || 'USDT,USDC').split(','),
    };
  }
}

// Database Service
class DatabaseService {
  private client: SupabaseClient;
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.logger = logger;
  }

  async saveApyData(pools: any[]): Promise<void> {
    try {
      this.logger.info('Saving data to Supabase...');
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
      
      const records: ApyRecord[] = pools.map(pool => ({
        pool_id: `${pool.symbol}_${pool.chain}_${pool.project}_${pool.poolMeta || ''}`,
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
        data_source: 'Defillama'
      }));
      

      const { error } = await this.client
      .from('apy_history')
      .upsert(records, { onConflict: 'pool_id,timestamp' });
          if (error) throw error;

      this.logger.info(`Saved ${records.length} records to Supabase.`);
    } catch (error) {
      this.logger.error(`Failed to save data to Supabase: ${error}`);
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
      this.logger.info('Fetching pools from DeFiLlama API...');
      const response = await axios.get('https://yields.llama.fi/pools');
      const data = response.data?.data || [];

      this.logger.info(`Fetched ${data.length} pools.`);
      const config = this.configService.loadConfig();

      const filteredPools = data.filter((pool: any) => config.tokens.includes(pool.symbol));
      this.logger.info(`Filtered to ${filteredPools.length} relevant pools.`);

      filteredPools.forEach((pool: { symbol: string; chain: string; project: string; apy: number; tvlUsd: number }) => {
        this.logger.info(`Pool: ${pool.symbol}, Chain: ${pool.chain}, Project: ${pool.project}, APY: ${pool.apy.toFixed(2)}%, TVL: $${pool.tvlUsd.toLocaleString()}`);
      });

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
        this.logger.warn('No data fetched, skipping save.');
      }
    } catch (error) {
      this.logger.error(`Critical error in data collection: ${error}`);
    }
  }
}

// Start Process
const COLLECTION_INTERVAL = parseInt(process.env.COLLECTION_INTERVAL || '300', 10);
const collector = new DataCollector();

if (require.main === module) {
    console.log('Starting data collection...');
    collector.runDataCollection();
  setInterval(() => collector.runDataCollection(), COLLECTION_INTERVAL * 1000);
}
