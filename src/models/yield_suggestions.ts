import { Chain, DataSource } from "../types/enums";
import { InvestmentTimeframe, RiskTolerance } from "../types/types";
import { YieldAction } from "./yield_actions";

export interface YieldSuggestion {
  id: number;
  timestamp: Date;
  insight: string;
  actions?: YieldAction[] | null; // returns null if `is_actionable` is false
  isActionable: boolean;
  chain: Chain;
  symbol: string;
  project: string;
  originalId: string;
  dataSource: DataSource;
  investmentTimeframe: InvestmentTimeframe;
  riskTolerance: RiskTolerance;
  createdAt: Date;
  updatedAt: Date;
}
