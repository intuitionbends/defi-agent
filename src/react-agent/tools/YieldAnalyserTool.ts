import { AptosYieldAnalyser } from "../service/AptosYieldAnalyser.js";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { PoolYieldRecord } from "../../../types/yields.js";

export default class GetTopAptosYieldsTool extends StructuredTool {
  name = "getTopAptosYields";
  description = "Returns the top yield opportunities on the Aptos chain. You can optionally filter by a category (project name).";

  schema = z.object({
    limit: z.number().nullable().default(5), 
    category: z.string().nullable(),
  });

  async _call({ limit, category }: { limit: number | null; category: string | null }): Promise<string> {
    try {
      const analyzer = new AptosYieldAnalyser();
      const effectiveLimit = limit ?? 5;
  
      let results: PoolYieldRecord[] = await analyzer.getTopAptosPools(effectiveLimit);
  
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
        `${pool.symbol} (${pool.project}) — ${pool.apy.toFixed(2)}% APY (TVL: $${pool.tvl_usd.toLocaleString()})`
      )).join("\n");
    } catch (err) {
      console.error("Error inside GetTopAptosYieldsTool:", err);
      return "An error occurred while fetching yields."; 
    }
  }
}