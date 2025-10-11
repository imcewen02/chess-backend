import { v4 as uuidv4 } from 'uuid';
import { getUsersConnections, emitToUser } from "./socketService";
import { Account } from "../models/account";
import { Game, State } from "../models/game";
import { Board } from '../models/board';
import { Position } from '../models/position';
import { Color } from '../models/pieces';
import { ApiError } from '../utils/ApiError';
import { updateAccountsElo } from './accountService';

var accountsInQueue: Account[] = [];
const activeGames = new Map<string, Game>();
const gameTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Returns all active games
 *
 * @returns all active games
 */
export function getAllActiveGames(): Map<string, Game> {
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
    const accountAlreadyInGame = Array.from(activeGames.values()).find(game => game.whitePlayer.username == account.username || game.blackPlayer.username == account.username) != undefined;
    if (accountAlreadyInQueue || accountAlreadyInGame) throw new ApiError(400, "User already in queue");

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

        currentState: State.WhitePlayersTurn,
        stateUpdatedAt: Date.now(),
    }

    activeGames.set(game.uuid, game);
    gameTimeouts.set(game.uuid, setTimeout(() => { game.whiteTimeRemaining = 0; updateGameState(game, State.BlackPlayerWinByTime); }, 300000));

    emitToUser(whitePlayer.username, "games:gameUpdate", game);
    emitToUser(blackPlayer.username, "games:gameUpdate", game);
}

/**
 * Moves the piece at the origin to the destination
 * Ensures that the user is authorized to move the piece at the current game state
 * Checks for any game end conditions
 * Updates the game accordingly
 *
 * @param uuid: the game uuid
 * @param playerMoving: the account of the player making the move
 * @param origin: the origin of the moving piece
 * @param destination: the destination of the moving piece
 */
export function movePiece(uuid: string, playerMoving: Account, origin: Position, destination: Position): void {
    const game = activeGames.get(uuid);
    if (game == null) throw new ApiError(400, "Game Not Found");

    //Check that the player is authorized to make the move
    const playersColor = game.whitePlayer.username == playerMoving.username ? Color.White : Color.Black;
    const timeSpentOnTurn = Date.now() - game.stateUpdatedAt;
    if (game.board.getPieceAtPosition(origin)?.color != playersColor) throw new ApiError(401, "Unauthorized: Not your piece");
    if (playersColor == Color.White ? game.currentState != State.WhitePlayersTurn : game.currentState != State.BlackPlayersTurn) throw new ApiError(401, "Unauthorized: Not your turn");
    if ((playersColor == Color.White ? game.whiteTimeRemaining : game.blackTimeRemaining) < timeSpentOnTurn) throw new ApiError(401, "Unauthorized: No Time Remaining");

    game.board.movePiece(origin, destination, true);
    
    //Reduce time
    if (playersColor == Color.White) {
        game.whiteTimeRemaining = game.whiteTimeRemaining - timeSpentOnTurn;
        clearTimeout(gameTimeouts.get(game.uuid));
        gameTimeouts.set(game.uuid, setTimeout(() => { game.blackTimeRemaining = 0; updateGameState(game, State.WhitePlayerWinByTime); }, game.blackTimeRemaining));
    } else {
        game.blackTimeRemaining = game.blackTimeRemaining - timeSpentOnTurn;
        clearTimeout(gameTimeouts.get(game.uuid));
        gameTimeouts.set(game.uuid, setTimeout(() => { game.whiteTimeRemaining = 0; updateGameState(game, State.BlackPlayerWinByTime); }, game.whiteTimeRemaining));
    }

    //Change the game state
    if (game.board.isKingInCheckmate(playersColor == Color.White ? Color.Black : Color.White)) {
        updateGameState(game, playersColor == Color.White ? State.WhitePlayerWinByMate : State.BlackPlayerWinByMate);
    } else if (!game.board.doesColorHaveAnyMoves(playersColor == Color.White ? Color.Black : Color.White)) {
        updateGameState(game, State.Stalemate);
    } else {
        updateGameState(game, playersColor == Color.White ? State.BlackPlayersTurn : State.WhitePlayersTurn);
    }
}

function updateGameState(game: Game, state: State) {
    game.currentState = state;
    game.stateUpdatedAt = Date.now();

    if ([State.WhitePlayerWinByMate, 
        State.WhitePlayerWinByTime, 
        State.WhitePlayerWinByResignation, 
        State.BlackPlayerWinByMate, 
        State.BlackPlayerWinByTime, 
        State.BlackPlayerWinByResignation, 
        State.Stalemate, 
        State.Draw].find(state => state == game.currentState)
    ) {
        clearTimeout(gameTimeouts.get(game.uuid));
        gameTimeouts.delete(game.uuid);
        activeGames.delete(game.uuid);

        const kFactor = 30;
        const whitePlayersExpectedScore = 1 / (1 + (10 ** ((game.blackPlayer.elo - game.whitePlayer.elo) / 400)));
        const blackPlayersExpectedScore = 1 / (1 + (10 ** ((game.whitePlayer.elo - game.blackPlayer.elo) / 400)));

        let whitePlayersScore = 0.5;
        let blackPlayersScore = 0.5;

        if ([State.WhitePlayerWinByMate, State.WhitePlayerWinByTime, State.WhitePlayerWinByResignation].find(state => state == game.currentState)) {
            whitePlayersScore = 1;
            blackPlayersScore = 0;
        }

        if ([State.BlackPlayerWinByMate, State.BlackPlayerWinByTime, State.BlackPlayerWinByResignation].find(state => state == game.currentState)) {
            whitePlayersScore = 0;
            blackPlayersScore = 1;
        }

        let whitePlayersNewElo = Math.floor(game.whitePlayer.elo + (kFactor * (whitePlayersScore - whitePlayersExpectedScore)));
        if (whitePlayersNewElo < 0) whitePlayersNewElo = 0;
        updateAccountsElo(game.whitePlayer, whitePlayersNewElo);
        game.whitePlayer.elo = whitePlayersNewElo;

        let blackPlayersNewElo = Math.floor(game.blackPlayer.elo + (kFactor * (blackPlayersScore - blackPlayersExpectedScore)));
        if (blackPlayersNewElo < 0) blackPlayersNewElo = 0;
        updateAccountsElo(game.blackPlayer, blackPlayersNewElo);
        game.blackPlayer.elo = blackPlayersNewElo;
    }

    emitToUser(game.whitePlayer.username, "games:gameUpdate", game);
    emitToUser(game.blackPlayer.username, "games:gameUpdate", game);
}