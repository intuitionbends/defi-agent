import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { PoolYield } from "../../types/types.js";
import { DatabaseService } from "../../core/services/Database";
import winston from "winston";
import { Chain } from "../../types/enums.js";
import { formatNumberReadable } from "@intuition-bends/common-js";

export default class GetTopAptosYieldsTool extends StructuredTool {
  public name = "getTopAptosYields";
  public description = "Returns the top yield opportunities on the Aptos chain. You can optionally filter by a category (project name).";

  public schema = z.object({
    limit: z.number().nullable().default(5),
    category: z.string().nullable(),
  });

  private logger: winston.Logger;
  private databaseService: DatabaseService;

  constructor(logger: winston.Logger, databaseService: DatabaseService) {
    super();

    this.logger = logger;
    this.databaseService = databaseService;
  }

  async _call({limit, category }: { limit: number | null; category: string | null; }): Promise<string> {
    try {
      let yields: PoolYield[] = await this.databaseService.getTopAPYPoolYields( Chain.Aptos, 100_000, limit || 5);

      if (!yields) {
        return "No yields found.";
      }

      if (category) {
        yields = yields.filter((y) => y.project?.toLowerCase().includes(category.toLowerCase()));
      }

      if (!yields.length) {
        return "No pool yields found.";
      }

      return yields
        .map(
          (y) =>
            `[${y.project}] ${y.symbol} — ${y.apy.toFixed(2)}% APY (TVL: $${formatNumberReadable(y.tvlUsd, 2)})`,
        )
        .join("\n");
    } catch (err) {
      return "An error occurred while fetching yields.";
    }
  }
}

