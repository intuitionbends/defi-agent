import { Action } from "./actions";

export interface Suggestion {
  id: number,
  walletAddress: string,
  summary: string,
  actions: Action[],
  status: SuggestionStatus
}

enum SuggestionStatus {
  New = 0,
  Completed = 1,
  Cancelled = 2,
  Reverted = 3
}
