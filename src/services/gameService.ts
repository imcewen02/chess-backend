import { v4 as uuidv4 } from 'uuid';
import { Account } from "../models/account";
import { Game } from "../models/game";
import { Board } from '../models/board';
import { getUsersConnections, emitToUser } from "./socketService";
import { getAccountsActiveGame } from './accountService';
import { Position } from '../models/position';

var accountsInQueue: Account[] = [];
var activeGames: Game[] = [];

/**
 * Adds the given account to the queue unless the account is already in queue
 * Will then attempt to matchmake for all users in queue
 *
 * @param account: the account to add to the queue
 */
export function joinQueue(account: Account): void {
    const accountAlreadyInQueue = accountsInQueue.find(accountInQueue => accountInQueue.username == account.username) != undefined;
    const accountAlreadyInGame = activeGames.find(game => game.whiteAccount.username == account.username || game.blackAccount.username == account.username) != undefined;
    if (accountAlreadyInQueue || accountAlreadyInGame) return;

    accountsInQueue.push(account);

    accountsInQueue = accountsInQueue.filter(accountInQueue => getUsersConnections(accountInQueue.username).size > 0);

    if (accountsInQueue.length > 1) {
        startGame(accountsInQueue[0], accountsInQueue[1]);
        accountsInQueue.splice(0, 2);
    }
}

/**
 * Creates a new game with the specified users
 *
 * @param account1: the account of player 1
 * @param account2: the account of player 2
 */
export function startGame(account1: Account, account2: Account): void {
    const board = new Board();

    const game: Game = {
        uuid: uuidv4(),
        whiteAccount: account1,
        blackAccount: account2,
        board: board,
        currentTurn: "white",
        currentAvailableMoves: board.getCurrentMoveOptions("white")
    }

    activeGames.push(game);

    emitToUser(account1.username, "games:gameUpdate", game);
    emitToUser(account2.username, "games:gameUpdate", game);
}

/**
 * Returns all active games
 *
 * @returns all active games
 */
export function getAllActiveGames(): Game[] {
    return activeGames;
}

export function movePiece(accountMoving: Account, origin: Position, destination: Position) {
    const game = activeGames.find(game => game.whiteAccount.username == accountMoving.username || game.blackAccount.username == accountMoving.username);

    game!.board.movePiece(origin, destination);
    game!.currentTurn = game?.currentTurn == "white" ? "black" : "white";
    game!.currentAvailableMoves = game!.board.getCurrentMoveOptions(game!.currentTurn);

    emitToUser(game!.whiteAccount.username, "games:gameUpdate", game);
    emitToUser(game!.blackAccount.username, "games:gameUpdate", game);
}