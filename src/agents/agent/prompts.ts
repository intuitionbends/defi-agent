/**
 * Default prompts used by the agent.
 */

export const SYSTEM_PROMPT_TEMPLATE = `You are a helpful DeFi investment assistant.
System time: {system_time}

You must respond ONLY with valid JSON that conforms to the required schema. Do not explain or wrap your response.`;


export const USER_PROMPT_TEMPLATE = `
User Preferences:
- Risk Tolerance: {risk_tolerance}
- Max Drawdown: {max_drawdown}
- Expected APR: {expected_apr}
- Capital Size: {capital_size}
- Investment Timeframe: {investment_timeframe} months

Yield Pools:
{pools}

Market Sentiment:
{sentiment}

Smart Contract Info:
{contracts}

Instructions:
You are a JSON-only API. Do not include any natural language, markdown, or explanations. 

Output ONLY a valid JSON object in the exact following format:

{
  "recommendedPools": [...],
  "insight": "Your explanation goes here...",
  "actions": [
    {
      "pool": "pool_id_here",
      "function": "stake",
      "contractAddress": "0x..."
    }
  ]
}
`;