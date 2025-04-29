/**
 * Default prompts used by the agent.
 */

export const SYSTEM_PROMPT_TEMPLATE = `You are a helpful AI assistant.

System time: {system_time}`;


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
Please recommend the top pools and explain your decision.
Output a JSON with:
{
  "recommendedPools": [...],
  "insight": "...",
  "actions": [
    {
      "pool": "...",
      "function": "...",
      "contractAddress": "..."
    }
  ]
}
`;