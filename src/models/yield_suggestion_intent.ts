import { YieldSuggestionIntentTxHistory } from "./yield_suggestion_intent_tx_history";
import { YieldSuggestion } from "./yield_suggestions";

export interface YieldSuggestionIntent {
  id?: number;
  walletAddress: string;
  suggestionId: number;
  suggestion?: YieldSuggestion;
  assetAmount: number;
  status: YieldSuggestionIntentStatus;
  txHistory?: YieldSuggestionIntentTxHistory[];
}

export enum YieldSuggestionIntentStatus {
  NEW = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  REVERTED = 3,
}
