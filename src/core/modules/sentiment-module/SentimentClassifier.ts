
import axios from "axios";
import { NewsFetcher } from "./NewsFetcher"; 

export class SentimentModule {
  private newsFetcher: NewsFetcher;

  constructor() {
    this.newsFetcher = new NewsFetcher();
  }

  private async analyzeSentimentWithFinBERT(text: string): Promise<string> {
    const HF_API_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert";
    const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

    try {
      const response = await axios.post(
        HF_API_URL,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
          },
        }
      );

      const predictions = response.data;
      if (Array.isArray(predictions) && predictions.length > 0) {
        // Get label with highest score
        const sorted = predictions.sort((a, b) => b.score - a.score);
        return sorted[0].label.toLowerCase(); // "positive", "neutral", or "negative"
      }

      return "unknown";
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("FinBERT error:", error.response?.data || error.message);
      } else if (error instanceof Error) {
        console.error("FinBERT error:", error.message);
      } else {
        console.error("FinBERT error: Unknown error", error);
      }
      return "error";
    }
  }

  public async getMarketSentiment(): Promise<string> {
    const allNews = await this.newsFetcher.fetchAll();
    const aptosNews = this.newsFetcher.filterForAptosNews(allNews);

    const sentiments: string[] = [];

    for (const item of aptosNews) {
      const text = `${item.title} ${item.summary}`;
      const sentiment = await this.analyzeSentimentWithFinBERT(text);
      sentiments.push(sentiment);
    }

    // Aggregate sentiments
    const counts = sentiments.reduce(
      (acc, cur) => {
        acc[cur] = (acc[cur] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Return the majority sentiment
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "unknown";
  }
}