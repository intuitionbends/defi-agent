import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";
import { RiskTolerance } from "../types/types";
import { SuggestionService } from "../services/suggestions";
import { ActionService } from "../services/actions";
import { Suggestion, SuggestionStatus } from "../models/suggestions";
import { ActionStatus } from "../models/actions";

export function createApiV1Router(
  suggestionService: SuggestionService,
  actionService: ActionService,
): Router {
  const router = express.Router();

  router.get("/suggestions/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const suggestion = await suggestionService.getById(Number(id));

      if (!suggestion) {
        res.status(404).json({ error: "no suggestion found" });
        return;
      }

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

      // const yields = await dbService.getQualifiedPoolYields(
      //   chain as Chain,
      //   riskTolerance as RiskTolerance,
      //   Number(maxDrawdown),
      //   asset as string,
      //   Number(assetValueUsd),
      //   Number(investmentTimeframe),
      // );

      // TODO; add langchain to generate suggestions (replace mock)
      const suggestion: Suggestion = {
        walletAddress,
        summary: "mock suggestion",
        actions: [
          {
            sequenceNumber: 1,
            name: "swap",
            walletAddress,
            txData: "test",
            status: ActionStatus.New,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        status: SuggestionStatus.New,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await suggestionService.insertSuggestion(suggestion);

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
