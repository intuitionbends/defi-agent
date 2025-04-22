import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function testOpenRouter() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello! Who are you?" }
      ]
    }),
  });

  const data = await response.json();
  console.log("🧠 OpenRouter Response:", data);
}

testOpenRouter().catch(console.error);