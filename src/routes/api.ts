import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";
import { RiskTolerance } from "../types/types";
import { SuggestionService } from "../services/suggestions";
import { ActionService } from "../services/actions";

export function createApiV1Router(
  dbService: DatabaseService,
  suggestionService: SuggestionService,
  actionService: ActionService,
): Router {
  const router = express.Router();

  router.get("/suggestions/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const suggestion = await suggestionService.getById(Number(id));

      res.json(suggestion);
    } catch (error) {
      next(error);
      return;
    }
  });

  router.get(
    "/suggestions/:id/actions/:sequenceNumber",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, sequenceNumber } = req.params;

        const action = await actionService.getByKey(Number(id), Number(sequenceNumber));

        res.json(action);
      } catch (error) {
        next(error);
        return;
      }
    },
  );

  router.post("/suggestions/create", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        walletAddress,
        chain = Chain.Aptos,
        riskTolerance = RiskTolerance.Low,
        maxDrawdown = "0.2",
        asset = "USDT",
        assetValueUsd = "1000",
        investmentTimeframe = "30",
      } = req.body;

      const yields = await dbService.getQualifiedPoolYields(
        chain as Chain,
        riskTolerance as RiskTolerance,
        Number(maxDrawdown),
        asset as string,
        Number(assetValueUsd),
        Number(investmentTimeframe),
      );

      // TODO; add langchain to generate suggestions
      const suggestion = {};

      const result = await suggestionService.upsertSuggestions([]);

      res.json(suggestion);
    } catch (error) {
      next(error);
      return;
    }
  });

  router.post(
    "/suggestions/:id/actions/:sequenceNumber/sign",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, sequenceNumber } = req.params;

        const action = await actionService.getByKey(Number(id), Number(sequenceNumber));
        if (!action) {
          res.status(404).json({ error: "Action not found" });
          return;
        }

        // TODO: validate txSignature before submitting to chain

        const { walletAddress, txSignature } = req.body;

        // TODO: add sign transaction logic

        res.json();
      } catch (error) {
        next(error);
        return;
      }
    },
  );

  return router;
}
