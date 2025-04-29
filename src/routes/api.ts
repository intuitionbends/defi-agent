import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";
import { RiskTolerance } from "../types/types";

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
      // TODO: update default values
      const {
        riskTolerance = RiskTolerance.Low,
        maxDrawdown = "0.2",
        asset = "USDT",
        assetValueUsd = "1000",
        investmentTimeframe = "30",
      } = req.query;

      const yields = await dbService.getQualifiedPoolYields(
        Chain.Aptos,
        riskTolerance as RiskTolerance,
        Number(maxDrawdown),
        asset as string,
        Number(assetValueUsd),
        Number(investmentTimeframe),
      );

      res.json(yields);
    } catch (error) {
      next(error);
      return;
    }
  });

  return router;
}
