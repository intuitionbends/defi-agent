import { Config, Env } from "./config";
import { MarketService } from "./services/market";
import { OrderService } from "./services/order";
import PREMARKET_ABI from "./abis/premarket.json";
import { ethers } from "ethers";
import { CheckpointsService } from "./services/checkpoint";
import { EventService } from "./services/event";
import { Pool } from 'pg';
import { registerChainEventListeners } from "./handlers/handlers";

import dotenv from "dotenv";
import { syncMarkets } from "./jobs/sync";
import { backrunOrders } from "./jobs/backrun";
dotenv.config();

export let marketService: MarketService;
export let orderService: OrderService;
export let checkpointService: CheckpointsService;
export let eventService: EventService;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);
const contractAddress = process.env.CONTRACT_ADDRESS!;
const contract = new ethers.Contract(contractAddress, PREMARKET_ABI, provider);

const loadConfig = async (): Promise<Config> => {
  const env = process.env.ENV ?? "dev";
  const port = parseInt(process.env.PORT ?? "") || 8080;

  const config: Config = {
    env: env as Env,
    port: port,
  };

  return config;
};

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

const loadServices = (pool: Pool) => {
  marketService = new MarketService(pool);
  orderService = new OrderService(pool);
  checkpointService = new CheckpointsService(pool);
  eventService = new EventService(pool);
};

const main = async () => {
  console.log(`load config`);
  const config = await loadConfig();
  if (config === undefined) {
    throw new Error("no config loaded");
  }

  console.log(`connect to postgres`);

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await pool.connect();
    console.log('connected to postgres');
  } catch (error) {
    console.error('connect to PostgreSQL database:', error);
    throw error;
  }

  console.log(`load services`);
  loadServices(pool);

  syncMarkets(contract, provider, marketService);
  registerChainEventListeners(contract, marketService, orderService);
  backrunOrders(provider, orderService, eventService, checkpointService, contract);

  await new Promise(() => { });
};

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
