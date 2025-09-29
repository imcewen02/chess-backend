import { v4 as uuidv4 } from 'uuid';
import { getUsersConnections, emitToUser } from "./socketService";
import { Account } from "../models/account";
import { Game } from "../models/game";
import { Board } from '../models/board';
import { Position } from '../models/position';
import { Color } from '../models/pieces';

var accountsInQueue: Account[] = [];
var activeGames: Game[] = [];

/**
 * Returns all active games
 *
 * @returns all active games
 */
export function getAllActiveGames(): Game[] {
    return activeGames;
}

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
    const board = new Board(null);

    const game: Game = {
        uuid: uuidv4(),

        whitePlayer: whitePlayer,
        whiteTimeRemaining: 300000,

        blackPlayer: blackPlayer,
        blackTimeRemaining: 300000,

        board: board,

        currentTurn: Color.White,
        currentTurnSince: Date.now()
    }

    activeGames.push(game);

    emitToUser(whitePlayer.username, "games:gameUpdate", game);
    emitToUser(blackPlayer.username, "games:gameUpdate", game);
}

/**
 * Moves a the piece at the origin to the destination
 *
 * @param playerMoving: the account of the player making the move
 * @param origin: the origin of the moving piece
 * @param destination: the destination of the moving piece
 */
export function movePiece(playerMoving: Account, origin: Position, destination: Position): void {
    const game = activeGames.find(game => game.whitePlayer.username == playerMoving.username || game.blackPlayer.username == playerMoving.username);
    if (game == null) throw new Error("Game Not Found");

    const playersColor = game.whitePlayer.username == playerMoving.username ? Color.White : Color.Black;
    const timeSpentOnTurn = Date.now() - game.currentTurnSince;
    if (game.board.getPieceAtPosition(origin)?.color != playersColor) throw new Error("Unauthorized: Not your piece");
    if (game.currentTurn != playersColor) throw new Error("Unauthorized: Not your turn");
    if ((game.currentTurn == Color.White ? game.whiteTimeRemaining : game.blackTimeRemaining) < timeSpentOnTurn) throw new Error("Unauthorized: No Time Remaining");

    game.board.movePiece(origin, destination, true);
    
    if (game.currentTurn == Color.White) {
        game.whiteTimeRemaining = game.whiteTimeRemaining - timeSpentOnTurn;
    } else {
        game.blackTimeRemaining = game.blackTimeRemaining - timeSpentOnTurn;
    }

    game.currentTurn = game.currentTurn == Color.White ? Color.Black : Color.White;
    game.currentTurnSince = Date.now();

    emitToUser(game.whitePlayer.username, "games:gameUpdate", game);
    emitToUser(game.blackPlayer.username, "games:gameUpdate", game);
}