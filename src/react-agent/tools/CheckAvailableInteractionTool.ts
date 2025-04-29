import { Tool } from "langchain/tools";
import { DatabaseService } from "../../core/services/Database";
import { Chain } from "../../types/enums";

// interface CheckAvailableInteractionInput {
//   project: string;
// }

export class CheckAvailableInteractionTool extends Tool {
  name = "check_available_interaction";
  description = "Check if a yield staking or swap interaction is available for a project on a given chain.";

  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    super();
    this.databaseService = databaseService;
  }

  async _call(input: string): Promise<string> {

    console.log("Checking available interactions for project:", input);

    try {
      const availableInteractions = await this.databaseService.getAvailableInteractionsByProject(Chain.Aptos, input);

      if (availableInteractions.length > 0) {
        return `✅ Interaction(s) available for ${input} on : ${availableInteractions.map(i => i.name).join(", ")}`;
      } else {
        return `❌ No available interactions found for ${input} on .`;
      }
    } catch (error: any) {
      return `⚠️ Failed to check interactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  }
}