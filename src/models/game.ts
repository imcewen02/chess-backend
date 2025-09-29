import { Account } from "./account";
import { Board } from "./board";
import { Color } from "./pieces";

export interface Game {
	uuid: string;

	whitePlayer: Account;
	whiteTimeRemaining: number;

	blackPlayer: Account;
	blackTimeRemaining: number;

	board: Board;

	currentTurn: Color;
	currentTurnSince: number;
}