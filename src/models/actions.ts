import { Suggestion } from "./suggestions";

export interface Action {
  suggestionId: number;
  sequenceNumber: number;
  suggestion: Suggestion;
  name: string;
  walletAddress: string;
  txData: string;
  status: ActionStatus;
}

enum ActionStatus {
  New = 0,
  Completed = 1,
  Reverted = 2,
}
