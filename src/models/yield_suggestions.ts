import { YieldAction } from "./yield_actions";

export interface YieldSuggestion {
  id: number;
  insight: string;
  actions?: YieldAction[] | null; // returns null if `is_actionable` is false
  isActionable: boolean;
  symbol: string;
  investmentTimeframe: number;
  riskTolerance: RiskTolerance;
  createdAt: Date;
  updatedAt: Date;
}

enum RiskTolerance {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
