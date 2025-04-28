import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";

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
      const yields = await dbService.getTopAPYPoolYields(Chain.Aptos, 100_000, 3);

      res.json(yields);
    } catch (error) {
      next(error);
      return;
    }
  });

  return router;
}
