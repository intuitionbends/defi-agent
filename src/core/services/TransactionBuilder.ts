import winston from "winston";
import { DatabaseService } from "./Database";
import { DefiLlama } from "../../data-sources/defillama";
import { YieldAction, YieldActionType } from "../../models/yield_actions";
import { YieldSuggestion } from "../../models/yield_suggestions";

const defillamaPoolIDToActions: Map<string, YieldAction[]> = new Map([]);

export class TransactionBuilder {
  private dbService: DatabaseService;
  private logger: winston.Logger;

  constructor(databaseService: DatabaseService, logger: winston.Logger) {
    this.dbService = databaseService;
    this.logger = logger;
  }

  async buildYieldActionsBySuggestion(suggestion: YieldSuggestion): Promise<YieldAction[] | null> {
    const actions = defillamaPoolIDToActions.get("abc");
    return actions || null;

    const yieldActions: YieldAction[] = [];
    for (let i = 1; i <= 3; i++) {
      const action: YieldAction = {
        name: "stake",
        suggestionId: suggestion.id,
        suggestion: suggestion,
        sequenceNumber: i,
        walletAddress: "0x0000",
        title: "stake title",
        description: "stake description",
        actionType: YieldActionType.Stake,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      yieldActions.push(action);
    }

    return yieldActions;
  }
}
