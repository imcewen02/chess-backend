import { v4 as uuidv4 } from 'uuid';
import { Account } from "../models/account";
import { Game } from "../models/game";
import { Board } from '../models/board';
import { getUsersConnections, emitToUser } from "./socketService";
import { Position } from '../models/position';
import { Color } from '../models/pieces';

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
    const accountAlreadyInGame = activeGames.find(game => game.whitePlayer.username == account.username || game.blackPlayer.username == account.username) != undefined;
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
 * @param whitePlayer: the account of the white player
 * @param blackPlayer: the account of the black player
 */
export function startGame(whitePlayer: Account, blackPlayer: Account): void {
    const board = new Board();

    const game: Game = {
        uuid: uuidv4(),
        whitePlayer: whitePlayer,
        blackPlayer: blackPlayer,
        board: board,
        currentTurn: Color.White
    }

    activeGames.push(game);

    emitToUser(whitePlayer.username, "games:gameUpdate", game);
    emitToUser(blackPlayer.username, "games:gameUpdate", game);
}

/**
 * Returns all active games
 *
 * @returns all active games
 */
export function getAllActiveGames(): Game[] {
    return activeGames;
}

/**
 * Moves a the piece at the origin to the destination
 *
 * @param playerMoving: the account of the player making the move
 * @param origin: the origin of the moving piece
 * @param destination: the destination of the moving piece
 */
export function movePiece(playerMoving: Account, origin: Position, destination: Position) {
    const game = activeGames.find(game => game.whitePlayer.username == playerMoving.username || game.blackPlayer.username == playerMoving.username);
    if (game == null) throw new Error("Game Not Found");

    //TODO check that the player moving the piece is allowed to do so (their turn and also their piece)

    game.board.movePiece(origin, destination, true);
    game.currentTurn = game.currentTurn == Color.White ? Color.Black : Color.White;

    emitToUser(game.whitePlayer.username, "games:gameUpdate", game);
    emitToUser(game.blackPlayer.username, "games:gameUpdate", game);
}