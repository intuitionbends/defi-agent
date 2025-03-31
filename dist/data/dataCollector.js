"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const supabase_js_1 = require("@supabase/supabase-js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = __importDefault(require("winston"));
dotenv_1.default.config();
// Logging Service
class LoggerService {
    constructor() {
        const logDir = path_1.default.join(__dirname, '../logs');
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
        this.logger = winston_1.default.createLogger({
            level: 'info',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)),
            transports: [
                new winston_1.default.transports.File({ filename: path_1.default.join(logDir, `collector_${new Date().toISOString().split('T')[0]}.log`) }),
                new winston_1.default.transports.Console(),
            ],
        });
    }
    info(message) { this.logger.info(message); }
    error(message) { this.logger.error(message); }
    warn(message) { this.logger.warn(message); }
}
// Config Service
class ConfigService {
    constructor() {
        this.configPath = path_1.default.join(__dirname, '../config/config.json');
    }
    loadConfig() {
        try {
            if (fs_1.default.existsSync(this.configPath)) {
                return JSON.parse(fs_1.default.readFileSync(this.configPath, 'utf-8'));
            }
        }
        catch (error) {
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
    constructor(logger) {
        const SUPABASE_URL = process.env.SUPABASE_URL || '';
        const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
        this.client = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY);
        this.logger = logger;
    }
    saveApyData(pools) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.info('Saving data to Supabase...');
                const currentTime = Math.floor(Date.now() / 1000);
                const records = pools.map(pool => ({
                    pool_id: `${pool.symbol}_${pool.chain}_${pool.project}_${pool.poolMeta || ''}`,
                    asset: pool.symbol,
                    chain: pool.chain,
                    apy: pool.apy || 0,
                    tvl: pool.tvlUsd || 0,
                    timestamp: currentTime,
                    apy_base: pool.apyBase || 0,
                    apy_reward: pool.apyReward || 0,
                    apy_mean_30d: pool.apyMean30d || 0,
                    apy_change_1d: pool.apyPct1D || 0,
                    apy_change_7d: pool.apyPct7D || 0,
                    apy_change_30d: pool.apyPct30D || 0,
                    data_source: 'Defillama'
                }));
                const { error } = yield this.client.from('apy_history').upsert(records, { onConflict: ['pool_id', 'timestamp'] });
                if (error)
                    throw error;
                this.logger.info(`Saved ${records.length} records to Supabase.`);
            }
            catch (error) {
                this.logger.error(`Failed to save data to Supabase: ${error}`);
            }
        });
    }
}
// Data Collector Service
class DataCollector {
    constructor() {
        this.logger = new LoggerService();
        this.configService = new ConfigService();
        this.dbService = new DatabaseService(this.logger);
    }
    fetchPools() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                this.logger.info('Fetching pools from DeFiLlama API...');
                const response = yield axios_1.default.get('https://yields.llama.fi/pools');
                const data = ((_a = response.data) === null || _a === void 0 ? void 0 : _a.data) || [];
                this.logger.info(`Fetched ${data.length} pools.`);
                const config = this.configService.loadConfig();
                const filteredPools = data.filter((pool) => config.tokens.includes(pool.symbol));
                this.logger.info(`Filtered to ${filteredPools.length} relevant pools.`);
                filteredPools.forEach(pool => {
                    this.logger.info(`Pool: ${pool.symbol}, Chain: ${pool.chain}, Project: ${pool.project}, APY: ${pool.apy.toFixed(2)}%, TVL: $${pool.tvlUsd.toLocaleString()}`);
                });
                return filteredPools;
            }
            catch (error) {
                this.logger.error(`Error fetching pool data: ${error}`);
                return [];
            }
        });
    }
    runDataCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pools = yield this.fetchPools();
                if (pools.length > 0) {
                    yield this.dbService.saveApyData(pools);
                }
                else {
                    this.logger.warn('No data fetched, skipping save.');
                }
            }
            catch (error) {
                this.logger.error(`Critical error in data collection: ${error}`);
            }
        });
    }
}
// Start Process
const COLLECTION_INTERVAL = parseInt(process.env.COLLECTION_INTERVAL || '300', 10);
const collector = new DataCollector();
if (require.main === module) {
    collector.logger.info('Starting data collection...');
    collector.runDataCollection();
    setInterval(() => collector.runDataCollection(), COLLECTION_INTERVAL * 1000);
}
