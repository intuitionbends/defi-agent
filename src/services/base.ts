import { Pool } from "pg";

export class BaseService {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }
}
