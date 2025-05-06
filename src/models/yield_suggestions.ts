import { Chain, DataSource } from "../types/enums";
import { InvestmentTimeframe, RiskTolerance } from "../types/types";
import { YieldAction } from "./yield_actions";

export interface YieldSuggestion {
  id: number;
  timestamp: Date;
  insight: string;
  symbol: string;
  investmentTimeframe: InvestmentTimeframe;
  riskTolerance: RiskTolerance;
  chain: Chain;
  project: string;
  dataSource: DataSource;
  isActionable: boolean;
  actions?: YieldAction[] | null; // returns null if `is_actionable` is false
  createdAt: Date;
  updatedAt: Date;
}
