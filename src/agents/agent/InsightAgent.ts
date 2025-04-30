import { SYSTEM_PROMPT_TEMPLATE , USER_PROMPT_TEMPLATE } from "./prompts";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { InsightAgentInput } from "../../types/types";

export interface InsightAgentOutput {
  recommendedPools: any[];
  insight: string;
  actions: { pool: string; function: string; contractAddress: string }[];
}

export class InsightAgent {
  private model: ChatOpenAI;

  constructor(key: string) {
    this.model = new ChatOpenAI({
      temperature: 0.3,
      modelName: "openai/gpt-4",
      openAIApiKey: key,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "project-url",
          "X-Title": "defi-yield-insight-agent"
        }
      }
    });
  }

  async generate(input: InsightAgentInput): Promise<InsightAgentOutput> {
    const systemTime = new Date().toISOString();

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{system_time}", systemTime);

    const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{risk_tolerance}", input.preferences.riskTolerance)
    .replace("{max_drawdown}", input.preferences.maxDrawdown.toString())
    .replace("{capital_size}", input.preferences.capitalSize.toString())
    .replace("{investment_timeframe}", input.preferences.investmentTimeframe.toString())
    .replace("{pools}", JSON.stringify(input.pools, null, 2))
    .replace("{sentiment}", input.sentiment || "Unknown")
    .replace("{contracts}", JSON.stringify(input.contracts || [], null, 2));

    // Call the model with the system and user prompts
    const response = await this.model.call([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    try {
      return JSON.parse(response.text.trim());
    } catch (err) {
      throw new Error("Failed to parse AI response as JSON:\n" + response.text);
    }
  }
}