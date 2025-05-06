import { YieldSuggestion } from "./yield_suggestions";

export interface YieldSuggestionIntentTxHistory {
  walletAddress: string;
  suggestion: YieldSuggestion;
  sequence_number: number;
  txHash: number;
  txStatus: TransactionStatus;
}

export enum TransactionStatus {
  PENDING = 0,
  FINALIZED = 1,
}
