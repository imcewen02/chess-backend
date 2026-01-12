import { Pool, QueryResult } from "pg";
import { Account } from "../models/account"
import DB_POOL from "../config/dbPool";

export class AccountRepository {
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
      FROM ${AccountRepository.TABLE};
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
      SELECT username, password, elo
      FROM ${AccountRepository.TABLE}
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
  async insert(username: string, passwordHash: string, elo: number): Promise<void> {
    const query = `
      INSERT INTO ${AccountRepository.TABLE} (username, password, elo)
      VALUES ($1, $2, $3);
    `;

    await this.pool.query(query, [username, passwordHash, elo]);
  }

  /**
   * Updates the accounts elo
   * 
   * @param username The username of the account to update
   * @param elo The new elo of the account
   */
  async updateElo(username: string, elo: number): Promise<void> {
    const query = `
      UPDATE ${AccountRepository.TABLE}
      SET elo = $1
      WHERE username = $2;
    `;

    await this.pool.query(query, [elo, username]);
  }
}

const accountRepository = new AccountRepository(DB_POOL);

export default accountRepository;