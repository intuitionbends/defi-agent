import { BaseService } from "./base";
import { Suggestion } from "../models/suggestions";

export class SuggestionService extends BaseService {
  async getById(id: number): Promise<Suggestion | null> {
    const result = await this.pool.query(
      `
      SELECT * FROM suggestions
      WHERE id = $1
    `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return anyToSuggestion(result.rows[0]);
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

  async insertSuggestion(suggestion: Suggestion): Promise<number> {
    await this.pool.query("BEGIN");

    const result = await this.pool.query(
      `INSERT INTO suggestions (wallet_address, summary, status) 
       VALUES ($1, $2, $3)
        RETURNING id
       `,
      [suggestion.walletAddress, suggestion.summary, suggestion.status],
    );

    suggestion.id = result.rows[0].id;

    // Insert actions for this suggestion
    if (suggestion.actions && suggestion.actions.length > 0) {
      const actionResult = await this.pool.query(
        `INSERT INTO actions (suggestion_id, sequence_number, name, wallet_address, tx_data, status)
       VALUES ${suggestion.actions.map((_, i) => `($1, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, $${i * 5 + 6})`).join(", ")}`,
        [
          suggestion.id,
          ...suggestion.actions.flatMap((action, index) => [
            index + 1, // sequence_number
            action.name,
            suggestion.walletAddress,
            action.txData,
            action.status,
          ]),
        ],
      );

      if (actionResult.rowCount === 0) {
        throw new Error("insert actions");
      }
    }

    await this.pool.query("COMMIT");

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
