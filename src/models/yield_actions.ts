import { YieldSuggestion } from "./yield_suggestions";

export interface YieldAction {
  suggestionId: number;
  suggestion?: YieldSuggestion;
  sequenceNumber: number;
  title: string;
  description: string;
  actionType: YieldActionType;
  createdAt: Date;
  updatedAt: Date;
}

export enum YieldActionType {
  Swap = 0,
  Stake = 1,
}
