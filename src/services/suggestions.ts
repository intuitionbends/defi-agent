import { BaseService } from "./base";
import { Suggestion } from "../models/suggestions";

export class SuggestionService extends BaseService {
  async getById(id: number): Promise<Suggestion[]> {
    const result = await this.pool.query(
      `
      SELECT * FROM suggestions
      WHERE id = $1
    `,
      [id],
    );

    return result.rows.map(anyToSuggestion);
  }

  async getByWalletAddress(walletAddress: string, limit: number = 10): Promise<Suggestion[]> {
    const result = await this.pool.query(
      `
      SELECT * FROM suggestions
      WHERE wallet_address = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
      [walletAddress, limit],
    );

    return result.rows.map(anyToSuggestion);
  }
}

const anyToSuggestion = (data: any): Suggestion => {
  return {
    id: data.id,
    walletAddress: data.wallet_address,
    summary: data.summary,
    actions: data.actions,
    status: data.status,
  };
};
