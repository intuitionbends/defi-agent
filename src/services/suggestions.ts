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

  async upsertSuggestions(suggestions: Suggestion[]): Promise<number> {
    const result = await this.pool.query(
      `INSERT INTO suggestions (id, wallet_address, summary, actions, status, created_at, updated_at) 
       VALUES ${suggestions.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(", ")}
       ON CONFLICT (id) DO UPDATE SET 
       wallet_address = EXCLUDED.wallet_address,
       summary = EXCLUDED.summary,
       actions = EXCLUDED.actions,
       status = EXCLUDED.status,
       updated_at = EXCLUDED.updated_at`,
      suggestions.flatMap((suggestion) => [
        suggestion.id,
        suggestion.walletAddress,
        suggestion.summary,
        suggestion.actions,
        suggestion.status,
        suggestion.createdAt || new Date(),
        suggestion.updatedAt || new Date(),
      ]),
    );

    return result.rowCount || 0;
  }
}

const anyToSuggestion = (data: any): Suggestion => {
  return {
    id: data.id,
    walletAddress: data.wallet_address,
    summary: data.summary,
    actions: data.actions,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};
