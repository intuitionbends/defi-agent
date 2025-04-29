import { DatabaseService } from "../services/Database";
import { RiskTolerance, Chain } from "../../types/enums";
import { PoolYield } from "../../types/types";

interface MappingInput {
  chain?: Chain;
  riskTolerance: RiskTolerance;
  maxDrawdown: number;
  expectedAPR: number;
  capitalSize: number; // TODO: USDT/ USDC
  investmentTimeframe: number;
  assetSymbol: string;
  limit?: number;
}

export class MappingModule {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  async getQualifiedPools(input: MappingInput): Promise<PoolYield[]> {
    const {
      chain = Chain.Aptos,
      riskTolerance,
      maxDrawdown,
      capitalSize,
      investmentTimeframe,
      assetSymbol,
      limit = 5
    } = input;

    // Later: you may refine logic using drawdown + timeframe
    const pools = await this.dbService.getQualifiedPoolYields(
      chain,
      riskTolerance,
      maxDrawdown,
      assetSymbol,
      capitalSize,
      investmentTimeframe,
      limit
    );

    // Optional post-filtering
    const filtered = pools.filter(pool => pool.apy >= input.expectedAPR * 100);

    return filtered;
  }
}