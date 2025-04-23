import { AptosYieldAnalyzer } from "../../analytics/yieldAnalyzer";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

export class GetTopAptosYieldsTool extends StructuredTool {
  name = "getTopAptosYields";
  description = "Returns the top yield opportunities on the Aptos chain";

  schema = z.object({
    limit: z.number().default(5).optional(),
    category: z.string().optional(), 
  });

  async _call({ limit = 5, category }: { limit?: number; category?: string }) {
    const analyzer = new AptosYieldAnalyzer();
    const results = await analyzer.getTopAptosPools(limit);

    if (!results.length) return "No high-yield pools found.";

    return results.map(pool => (
      `${pool.asset} in ${pool.pool_id} — ${pool.apy.toFixed(2)}% APY (TVL: $${pool.tvl.toLocaleString()})`
    )).join("\n");
  }
}

// // For local test only
// if (require.main === module) {
//     const tool = new GetTopAptosYieldsTool();
//     tool.invoke({ limit: 3 }).then(console.log);
//   }

// 👇 Safe and compatible with both ESM and CommonJS
async function main() {
  const tool = new GetTopAptosYieldsTool();
  const result = await tool.invoke({ limit: 3 });
  console.log(result);
}

main();
