import { Account } from "./account";
import { Board } from "./board";
import { MoveSet } from "./moveSet";

export interface Game {
	uuid: string;

	whiteAccount: Account;
	blackAccount: Account;

	board: Board;

	currentTurn: "white" | "black";
	currentAvailableMoves: MoveSet[];
}