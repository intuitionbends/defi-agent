import { YieldSuggestion } from "./yield_suggestions";

export interface YieldAction {
  name: string;
  suggestion: YieldSuggestion;
  sequenceNumber: number;
  walletAddress: string;
  title: string;
  description: string;
  assetAmount: number;
  type: YieldActionType;
}

export enum YieldActionType {
  Swap = 0,
  Stake = 1,
}
