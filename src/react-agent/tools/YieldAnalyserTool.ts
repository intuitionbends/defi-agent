import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { PoolYield } from "../../types/types.js";
import { DatabaseService } from "../../core/services/Database";
import { Pool } from "pg";
import winston from "winston";
import { Chain } from "../../types/enums.js";
import dotenv from "dotenv";
dotenv.config();

export default class GetTopAptosYieldsTool extends StructuredTool {
  name = "getTopAptosYields";
  description = "Returns the top yield opportunities on the Aptos chain. You can optionally filter by a category (project name).";

  schema = z.object({
    limit: z.number().nullable().default(5), 
    category: z.string().nullable(),
  });

  async _call({ limit, category }: { limit: number | null; category: string | null }): Promise<string> {
    try {
      const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });

        console.log("Database URL:", process.env.DATABASE_URL);

      const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.simple()
        ),
        transports: [
          new winston.transports.Console()
        ]
      });
      const databaseService = new DatabaseService(pool, logger);      
      const effectiveLimit = limit ?? 5;
  
      let results: PoolYield[] = await databaseService.getTopAPYPoolYields(Chain.Aptos, 100_000, effectiveLimit);
      if (!results) {
        return "No results found."; 
      }
  
      if (category) {
        results = results.filter(pool =>
          pool.project?.toLowerCase().includes(category.toLowerCase())
        );
      }
  
      if (!results.length) {
        return "No high-yield pools found.";
      }
  
      return results.map(pool => (
        `${pool.symbol} (${pool.project}) — ${pool.apy.toFixed(2)}% APY (TVL: $${pool.tvlUsd.toLocaleString()})`
      )).join("\n");
    } catch (err) {
      console.error("Error inside GetTopAptosYieldsTool:", err);
      return "An error occurred while fetching yields."; 
    }
  }
}