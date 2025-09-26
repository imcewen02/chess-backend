import { Account } from "./account";
import { Board } from "./board";
import { Color } from "./pieces";

export interface Game {
	uuid: string;
	whitePlayer: Account;
	blackPlayer: Account;
	board: Board;
	currentTurn: Color;
}