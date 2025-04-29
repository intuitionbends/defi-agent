import { MappingModule } from "../modules/MapperModule";
import { SentimentModule } from "../modules/SentimentModule";
import { InsightAgent, InsightAgentOutput } from "../../agents/agent/InsightAgent";
import { DatabaseService } from "../services/Database";
import { UserPreferences } from "../../types/types";

export class OrchestratorController {
  private mapper: MappingModule;
  private sentimentModule: SentimentModule;
  private agent: InsightAgent;

  constructor(private dbService: DatabaseService) {
    this.mapper = new MappingModule(this.dbService);
    this.sentimentModule = new SentimentModule();
    this.agent = new InsightAgent();
  }

  public async run(preferences: UserPreferences): Promise<InsightAgentOutput> {
    try {
      // Step 1: Run all modules in parallel
      const [pools, sentiment, contracts] = await Promise.all([
        this.mapper.getQualifiedPools(preferences),
        this.sentimentModule.getMarketSentiment(),
        this.fetchAvailableContractInteractions(preferences.assetSymbol)
      ]);

      // Step 2: Prepare agent input
      const input = {
        preferences,
        pools,
        sentiment,
        contracts
      };

      // Step 3: Call AI agent
      const result = await this.agent.generate(input);

      return result;
    } catch (err) {
      console.error("Orchestrator error:", err);
      throw new Error("Failed to run suggestion pipeline.");
    }
  }

  // Placeholder — replace with actual contract-checker integration
  private async fetchAvailableContractInteractions(assetSymbol: string): Promise<any[]> {
    // TODO: Call actual smart contract checker module
    return [
      {
        pool: `${assetSymbol.toLowerCase()}-staking`,
        function: "stake",
        contractAddress: "0xABCDEF..."
      }
    ];
  }
}