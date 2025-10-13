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
	NotStarted,
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

export const GAME_OVER_STATES: State[] = [State.WhitePlayerWinByTime, State.BlackPlayerWinByTime, State.WhitePlayerWinByMate, State.BlackPlayerWinByMate, State.WhitePlayerWinByResignation, State.BlackPlayerWinByResignation, State.Draw, State.Stalemate];