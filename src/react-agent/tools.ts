/**
 * This file defines the tools available to the ReAct agent.
 * Tools are functions that the agent can use to interact with external systems or perform specific tasks.
 */
import { createLogger } from "@intuition-bends/common-js";
import GetTopAptosYieldsTool from "./tools/YieldAnalyserTool";
import { Pool } from "pg";
import { DatabaseService } from "../core/services/Database";

const logger = createLogger("getTopAptosYieldsAgent");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const databaseService = new DatabaseService(pool, logger);

const getTopAptosYields = new GetTopAptosYieldsTool(logger, databaseService);

/**
 * Export an array of all available tools
 * Add new tools to this array to make them available to the agent
 *
 * Note: You can create custom tools by implementing the Tool interface from @langchain/core/tools
 * and add them to this array.
 * See https://js.langchain.com/docs/how_to/custom_tools/#tool-function for more information.
 */

export const TOOLS = [getTopAptosYields];
