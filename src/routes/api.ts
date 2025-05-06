import express, { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "../core/services/Database";
import { Chain } from "../types/enums";
import { RiskTolerance, UserPreferences } from "../types/types";
import { OrchestratorController } from "../core/orchestrator/OrchestratorController";
import {
  AptosConfig,
  Aptos,
  SimpleTransaction,
  Deserializer,
  AccountAuthenticator,
} from "@aptos-labs/ts-sdk";

import dotenv from "dotenv";
import { TransactionStatus } from "../models/yield_suggestion_intent_tx_history";
dotenv.config();

export function createApiV1Router(dbService: DatabaseService): Router {
  const router = express.Router();
  const key = process.env.OPENROUTER_API_KEY as string;

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
        riskTolerance = RiskTolerance.LOW,
        maxDrawdown = "0.2",
        asset = "APT",
        assetValueUsd = "1000",
        investmentTimeframe = "6",
      } = req.query;

      const orchestrator = new OrchestratorController(dbService, key);

      const preferences: UserPreferences = {
        chain: Chain.Aptos,
        riskTolerance: riskTolerance as RiskTolerance,
        maxDrawdown: Number(maxDrawdown),
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

  router.get(
    "/yield_suggestions/latest",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const suggestions = await dbService.getYieldSuggestionsLatest();
        res.json(suggestions);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/yield_suggestions/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const suggestion = await dbService.getYieldSuggestion(Number(id));

      if (!suggestion) {
        res.status(404).json({ error: "Yield suggestion not found" });
        return;
      }

      res.json(suggestion);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/yield_suggestions/:id/yield_actions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const actions = await dbService.getYieldActionsBySuggestionId(Number(id));

        if (!actions) {
          res.status(404).json({ error: "Yield action not found" });
          return;
        }

        res.json(actions);
      } catch (error) {
        next(error);
      }
    },
  );

  // todo: add auth
  router.get(
    "/yield_suggestion_intents",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { walletAddress } = req.body;

        const suggestions = await dbService.getYieldSuggestionIntentsByWalletAddress(walletAddress);

        res.json(suggestions);
      } catch (error) {
        next(error);
      }
    },
  );

  // TODO: add auth
  router.get(
    "/yield_suggestion_intents/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { walletAddress } = req.body;

        const suggestions = await dbService.getYieldSuggestionIntent(Number(id));

        res.json(suggestions);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/yield_suggestions/:id/createIntent",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { amount, walletAddress } = req.body;

        if (!amount) {
          res.status(400).json({ error: "Missing required field: amount" });
          return;
        }

        if (!walletAddress) {
          res.status(400).json({ error: "Missing required field: walletAddress" });
          return;
        }

        const suggestion = await dbService.getYieldSuggestion(Number(id));

        if (!suggestion) {
          res.status(404).json({ error: "Yield suggestion not found" });
          return;
        }

        const intent = await dbService.createYieldSuggestionIntent(
          suggestion,
          walletAddress,
          amount,
        );

        res.json(intent);
      } catch (error) {
        next(error);
      }
    },
  );

  // TODO: add auth
  // TODO: tx builder to be published as npm package and consumed here
  router.get(
    "/yield_suggestion_intents/:id/latestTxData",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const intent = await dbService.getYieldSuggestionIntent(Number(req.params.id));

        if (!intent) {
          res.status(404).json({ error: "Yield suggestion intent not found" });
          return;
        }

        const txData = "";

        res.json(txData);
      } catch (error) {
        next(error);
      }
    },
  );

  // TODO: test
  router.post(
    "/yield_suggestion_intent/:id/submitSignedTransaction",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { transaction, signedTransaction } = req.body;

        const intent = await dbService.getYieldSuggestionIntent(Number(id));

        if (!intent) {
          res.status(404).json({ error: "Yield suggestion intent not found" });
          return;
        }

        if (!transaction || !signedTransaction) {
          res.status(400).json({ error: "Missing fields" });
          return;
        }

        const config = new AptosConfig({ fullnode: "https://fullnode.mainnet.aptoslabs.com/v1" });
        const aptos = new Aptos(config);

        const deserializedTransaction = SimpleTransaction.deserialize(
          new Deserializer(new Uint8Array(Array.from(transaction.bcsToBytes()))),
        );
        const senderAuthenticator = AccountAuthenticator.deserialize(
          new Deserializer(
            new Uint8Array(Array.from(signedTransaction.authenticator.bcsToBytes())),
          ),
        );

        const response = await aptos.transaction.submit.simple({
          transaction: deserializedTransaction,
          senderAuthenticator: senderAuthenticator,
        });

        await aptos.waitForTransaction({
          transactionHash: response.hash,
        });

        const currentSequenceNumber =
          await dbService.getYieldSuggestionIntentCurrentSequenceNumber(intent);

        const txHistory = await dbService.insertYieldSuggestionIntentTxHistory(
          intent,
          currentSequenceNumber,
          response.hash,
          TransactionStatus.FINALIZED,
        );

        res.json(txHistory);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/yield_suggestion_intent_tx_history",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { walletAddress } = req.body;

        const history =
          await dbService.getYieldSuggestionIntentTxHistoryByWalletAddress(walletAddress);

        res.json(history);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
