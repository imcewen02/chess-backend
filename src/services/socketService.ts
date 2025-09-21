import { Socket } from "socket.io";

const userConnections = new Map<string, Set<Socket>>(); //username, active connections

/**
 * Adds a new user connection if this is their first socket
 * Adds the socket to the users sockets
 * 
 * @param username: the username to register the connection to
 * @param socket: the socket to register
 */
export function registerConnection(username: string, socket: Socket): void {
    if (!userConnections.has(username)) {
        userConnections.set(username, new Set<Socket>());
    }

    userConnections.get(username)?.add(socket);
}

/**
 * Removes the socket from the users active sockets
 * Removes the user from the active connections if it was their last open socket
 * 
 * @param username: the username owning the connection
 * @param socket: the socket to remove
 */
export function removeConnection(username: string, socket: Socket): void {
    const usersConnections = userConnections.get(username);
    if (!socket) return;

    usersConnections?.delete(socket);

    if (usersConnections?.size == 0) userConnections.delete(username);
}

/**
 * Gets a users open sockets
 * 
 * @param username: the username to get connections for
 * 
 * @return the users open sockets
 */
export function getUsersConnections(username: string): Set<Socket> {
    return userConnections.has(username) ? userConnections.get(username)! : new Set<Socket>();
}

/**
 * Emits an event to all of a users open sockets
 * 
 * @param username: the username to send the event to
 * @param eventName: the name of the event to emit
 * @param data: the args of the event
 */
export function emitToUser(username: string, eventName: string, data: any): void {
    const usersConnections = getUsersConnections(username);
    for (const socket of usersConnections) {
        socket.emit(eventName, data);
    }
}