import { InvestmentTimeframe, RiskTolerance } from "../types/types";
import { YieldAction } from "./yield_actions";

export interface YieldSuggestion {
  id: number;
  timestamp: Date;
  insight: string;
  actions?: YieldAction[] | null; // returns null if `is_actionable` is false
  isActionable: boolean;
  symbol: string;
  investmentTimeframe: InvestmentTimeframe;
  riskTolerance: RiskTolerance;
  createdAt: Date;
  updatedAt: Date;
}
