import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { PoolYield } from "../../../types/types";
import { DatabaseService } from "../../../core/services/database";
import { Chain } from "../../../types/enums";

export default class GetTopAptosYieldsTool extends StructuredTool {
  name = "getTopAptosYields";
  description =
    "Returns the top yield opportunities on the Aptos chain. You can optionally filter by a category (project name).";

  schema = z.object({
    limit: z.number().optional().default(5),
    category: z.string().optional(), // Can be used for project filtering
  });

  async _call({ limit = 5, category }: { limit?: number; category?: string }): Promise<string> {
    const db = new DatabaseService(pool, logger);

    let results: PoolYield[] = await db.getTopAPYPoolYields(Chain.Aptos, 100_000, limit);

    if (category) {
      results = results.filter((pool) =>
        pool.project?.toLowerCase().includes(category.toLowerCase()),
      );
    }

    if (!results.length) return "No high-yield pools found.";

    return results
      .map(
        (pool) =>
          `${pool.symbol} (${pool.project}) — ${pool.apy.toFixed(2)}% APY (TVL: $${pool.tvl_usd.toLocaleString()})`,
      )
      .join("\n");
  }
}
