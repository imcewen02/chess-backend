import { Pool, QueryResult } from "pg";
import DB_POOL from "../config/dbPool";

export interface Account {
  username: string;
  password: string;
  elo: number;
  email: string;
}

export class AccountModel {
  private static readonly TABLE = `"Account"`;

  constructor(private readonly pool: Pool) {}

  /**
   * Fetch all accounts.
   * 
   * @returns The account details or null, if not found.
   */
  async getAll(): Promise<Account[]> {
    const query = `
      SELECT username, elo
      FROM ${AccountModel.TABLE};
    `;

    const result: QueryResult<Account> = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Fetch the info for an account by username.
   * 
   * @param username The username of the account.
   * 
   * @returns The account details or null, if not found.
   */
  async getByUsername(username: string): Promise<Account | null> {
    const query = `
      SELECT username, password, email, elo
      FROM ${AccountModel.TABLE}
      WHERE username = $1
      LIMIT 1;
    `;

    const result: QueryResult<Account> = await this.pool.query(query, [username]);
    return result.rows[0] ?? null;
  }

  /**
   * Insert a new account.
   * 
   * @param username The username of the new account.
   * @param passwordHash The hashed password of the new account.
   */
  async insert(username: string, passwordHash: string, elo: number, email: string): Promise<void> {
    const query = `
      INSERT INTO ${AccountModel.TABLE} (username, password, elo, email)
      VALUES ($1, $2, $3, $4);
    `;

    await this.pool.query(query, [username, passwordHash, elo, email]);
  }
}

const accountModel = new AccountModel(DB_POOL);
export default accountModel;