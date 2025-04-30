import { Suggestion } from "./suggestions";

export interface Action {
  suggestionId?: number;
  suggestion?: Suggestion;
  sequenceNumber: number;
  name: string;
  walletAddress: string;
  txData: string;
  status: ActionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ActionStatus {
  New = 0,
  Completed = 1,
  Reverted = 2,
}
