import winston from "winston";
import { YieldAction, YieldActionType } from "../../models/yield_actions";
import { YieldSuggestion } from "../../models/yield_suggestions";
import { Chain, DataSource } from "../../types/enums";

export class YieldActionBuilder {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async buildYieldActionsBySuggestion(suggestion: YieldSuggestion): Promise<YieldAction[] | null> {
    const actions = yieldSuggestionToYieldActions(suggestion);

    return actions;
  }
}

const yieldSuggestionToYieldActions = (suggestion: YieldSuggestion): YieldAction[] => {
  if (suggestion.dataSource === DataSource.Defillama) {
    return defillamaPoolYieldToYieldActions(
      suggestion.chain,
      suggestion.symbol,
      suggestion.project,
    );
  }

  return [];
};

const defillamaPoolYieldToYieldActions = (
  chain: Chain,
  symbol: string,
  project: string,
): YieldAction[] => {
  switch (chain) {
    case Chain.Aptos:
      if (symbol === "APT") {
        switch (project) {
          case "echelon":
            return [
              {
                title: "lend",
                description: "lend APT",
                suggestionId: 1,
                sequenceNumber: 1,
                actionType: YieldActionType.Stake,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          case "amnis":
            return [
              {
                title: "lend",
                description: "lend APT",
                suggestionId: 1,
                sequenceNumber: 1,
                actionType: YieldActionType.Stake,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
        }
      }

      return [];
    default:
      return [];
  }
};
