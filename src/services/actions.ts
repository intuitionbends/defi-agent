import { BaseService } from "./base";
import { Action } from "../models/actions";

export class ActionService extends BaseService {
  async getByKey(suggestionId: number, sequenceNumber: number): Promise<Action | null> {
    const result = await this.pool.query(
      `
      SELECT * FROM suggestions
      WHERE suggestion_id = $1 AND sequence_number = $2
    `,
      [suggestionId, sequenceNumber],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].map(anyToAction);
  }
}

const anyToAction = (data: any): Action => {
  return {
    suggestionId: data.suggestion_id,
    sequenceNumber: data.sequence_number,
    suggestion: data.suggestion,
    name: data.name,
    walletAddress: data.wallet_address,
    txData: data.tx_data,
    status: data.status,
  };
};
