import { Account } from "./accountModel";

export interface Game {
	uuid: string;
	whiteAccount: Account;
	blackAccount: Account;
}