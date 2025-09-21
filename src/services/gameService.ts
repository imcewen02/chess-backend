import { v4 as uuidv4 } from 'uuid';
import { Account } from "../models/accountModel";
import { Game } from "../models/gameModel";
import { getUsersConnections, emitToUser } from "./socketService";

var accountsInQueue: Account[] = [];
var activeGames: Game[] = [];

/**
 * Adds the given account to the queue unless the account is already in queue
 * Will then attempt to matchmake for all users in queue
 *
 * @param account: the account to add to the queue
 */
export function joinQueue(account: Account): void {
    console.log(account.username + " attempting to join queue");

    const accountAlreadyInQueue = accountsInQueue.find(accountInQueue => accountInQueue.username == account.username) != undefined;
    const accountAlreadyInGame = activeGames.find(game => game.whiteAccount.username == account.username || game.blackAccount.username == account.username) != undefined;
    if (accountAlreadyInQueue || accountAlreadyInGame) return;

    accountsInQueue.push(account);

    console.log(account.username + " joined queue");

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
    console.log("Game Starting")

    const game: Game = {
        uuid: uuidv4(),
        whiteAccount: account1,
        blackAccount: account2
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