import { DatabaseService } from "../services/Database";
import { RiskTolerance, PoolYield, UserPreferences, MappingInput } from "../../types/types";
import { Chain } from "../../types/enums";

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

    // TODO: Implement maxDrawdown and investmentTimeframe filtering
    const pools = await this.dbService.getQualifiedPoolYields(
      chain,
      riskTolerance,
      maxDrawdown,
      assetSymbol,
      capitalSize,
      investmentTimeframe,
      limit
    );

    console.log("Qualified pools:", pools);

    return pools;
  }
}