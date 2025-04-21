import { Chain, normalizeChain } from "./types/enums";

import * as dotenv from "dotenv";
dotenv.config();

type Env = "dev" | "production";

export interface Config {
  env: Env;
  databaseUrl: string;
  collectionInterval: number;
  protocols: string[];
  tokens: string[];
  chains: Chain[];
}

export const loadConfig = (): Config => {
  return {
    env: (process.env.NODE_ENV || "dev") as Env,
    databaseUrl: process.env.DATABASE_URL || "",
    collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || "300", 10),
    protocols: (process.env.WHITELIST_PROTOCOLS || "aave-v3,aave-v2").split(","),
    tokens: (process.env.WHITELIST_TOKENS || "USDT,USDC").split(","),
    chains: (process.env.WHITELIST_CHAINS || "aptos").split(",").map(normalizeChain),
  };
};
