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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const common_js_1 = require("@intuition-bends/common-js");
const dataCollector_1 = require("./core/services/dataCollector");
const env_1 = require("./config/env");
const database_1 = require("./core/services/database");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const logger = (0, common_js_1.createLogger)("defi-agent");
    logger.info("connect to postgres");
    const config = (0, env_1.loadConfig)();
    const pool = new pg_1.Pool({
        connectionString: config.databaseUrl,
        ssl: config.env === "production" ? { rejectUnauthorized: false } : false,
    });
    try {
        yield pool.connect();
        logger.info("connected to postgres");
    }
    catch (error) {
        logger.error("connect to postgres:", error);
        process.exit(1);
    }
    logger.info("start data collector");
    const dbService = new database_1.DatabaseService(config.databaseUrl, logger);
    const collector = new dataCollector_1.DataCollector(dbService, logger);
    collector.run(config.chains, config.collectionInterval);
    logger.info("started data collector");
});
main();
