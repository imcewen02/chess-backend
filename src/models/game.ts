import { Account } from "./account";
import { Board } from "./board";

export interface Game {
	uuid: string;

	whitePlayer: Account;
	whiteTimeRemaining: number;

	blackPlayer: Account;
	blackTimeRemaining: number;

	board: Board;

	currentState: State;
	stateUpdatedAt: number; //The last time the state was changed to the current state
}

export enum State {
	WhitePlayersTurn,
	BlackPlayersTurn,
	WhitePlayerWinByTime,
	BlackPlayerWinByTime,
	WhitePlayerWinByMate,
	BlackPlayerWinByMate,
	WhitePlayerWinByResignation,
	BlackPlayerWinByResignation,
	Stalemate,
	Draw
}