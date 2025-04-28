import { Pool } from "pg";
import { BaseService } from "./base";
import { Client } from "@langchain/langgraph-sdk";

export class ThreadService extends BaseService {
  private client: Client;

  constructor(pool: Pool, client: Client) {
    super(pool);
    this.client = new Client();
  }

  // async getThreadMessages(id: string): Promise<Message[]> {
  //   const history = await this.client.threads.getHistory(id);

  //   if (!history) {
  //     throw new Error(`Thread with ID ${id} not found`);
  //   }
  // }
}
