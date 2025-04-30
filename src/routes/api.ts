import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";
import { RiskTolerance, UserPreferences } from "../types/types";
import { OrchestratorController } from "../core/orchestrator/OrchestratorController";

export function createApiV1Router(dbService: DatabaseService): Router {
  const router = express.Router();

  router.get("/pool_yields/top", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const yields = await dbService.getTopAPYPoolYields(Chain.Aptos, 10);

      res.json(yields);
    } catch (error) {
      next(error);
      return;
    }
  });

  router.get("/pool_yields/suggest", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        riskTolerance = "Low",
        maxDrawdown = "0.2",
        asset = "APT",
        assetValueUsd = "1000",
        investmentTimeframe = "6"
      } = req.query;
  
      const orchestrator = new OrchestratorController(dbService);
  
      const preferences: UserPreferences = {
        chain: Chain.Aptos,
        riskTolerance: riskTolerance as RiskTolerance,
        maxDrawdown: Number(maxDrawdown),
        expectedAPR: 0.1,
        capitalSize: Number(assetValueUsd),
        investmentTimeframe: Number(investmentTimeframe),
        assetSymbol: "APT",
      };
  
      const yields = await orchestrator.run(preferences);
      res.json(yields);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
