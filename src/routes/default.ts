import express, { Router, Request, Response } from "express";

const defaultRouter: Router = express.Router();

defaultRouter.get("/health-check", (req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

export default defaultRouter;
