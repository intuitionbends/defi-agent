import axios from "axios";
import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

interface NewsItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  sentiment?: string;
  raw?: any;
}

export class NewsFetcher {
  private rssParser: Parser;

  constructor() {
    this.rssParser = new Parser();
  }

  // Fetch news from CryptoPanic API
  async fetchFromCryptoPanic(): Promise<NewsItem[]> {
    const url = "https://cryptopanic.com/api/v1/posts/";
    const response = await axios.get(url, {
      params: {
        auth_token: process.env.CRYPTOPANIC_API_KEY,
        public: true,
        regions: "en",
      },
    });

    return response.data.results.map((item: any): NewsItem => ({
      id: uuidv4(),
      source: "CryptoPanic",
      title: item.title,
      url: item.url,
      publishedAt: item.published_at,
      summary: item.domain,
      sentiment: item.sentiment || "unknown",
      raw: item,
    }));
  }

  // Fetch news from CoinDesk RSS feed
  async fetchFromCoinDesk(): Promise<NewsItem[]> {
    const feed = await this.rssParser.parseURL("https://coindesk.com/arc/outboundfeeds/rss/");
    return feed.items.map(item => ({
      id: uuidv4(),
      source: "CoinDesk",
      title: item.title || "No Title",
      url: item.link || "",
      publishedAt: item.pubDate || new Date().toISOString(),
      summary: item.contentSnippet || "",
      sentiment: "unknown",
      raw: item,
    }));
  }

  // Combine all news from different sources
  async fetchAll(): Promise<NewsItem[]> {
    const [cryptoPanicNews, coinDeskNews] = await Promise.all([
      this.fetchFromCryptoPanic(),
      this.fetchFromCoinDesk(),
    ]);

    // Combine and sort by date (descending)
    return [...cryptoPanicNews, ...coinDeskNews].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  filterForAptosNews(items: NewsItem[]): NewsItem[] {
    const aptosKeywords = [
      "aptos",
      "aptos chain",
      "aptos labs",
      "aptoslabs",
      "aptos ecosystem",
      "apt token",
      "move language",
      "aptos staking",
      "aptos defi"
    ];

    return items.filter(item => {
      const text = `${item.title} ${item.summary}`.toLowerCase();
      return aptosKeywords.some(keyword => text.includes(keyword));
    });
  }

  async fetchAptosNews(): Promise<NewsItem[]> {
    const allNews = await this.fetchAll();
    return this.filterForAptosNews(allNews);
  }
  
}

// For testing and example usage
if (require.main === module) {
  const fetcher = new NewsFetcher();
  fetcher.fetchAptosNews().then(news => {
    console.log("Fetched news:", news);
  }).catch(err => {
    console.error("Error fetching news:", err);
  });
}