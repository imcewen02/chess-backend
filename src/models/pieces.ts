import { Board } from "./board";
import { Position } from "./position";

export abstract class Piece {
    public readonly name: Name;
    public readonly value: number;
    public readonly color: Color;

    constructor(name: Name, value: number, color: Color) {
        this.name = name;
        this.value = value;
        this.color = color;
    }

    /**
     * Clones the existing piece for consequence free muatations, guranteed!
     * 
     * @returns the cloned piece
     */
    public abstract clone(): Piece;

    /**
     * Returns the pieces possible moves based on the input board
     * The referenced piece must exist on the input board
     * Will filter out moves putting the picees king into check if checkSafe is enabled
     * 
     * @param board: the board the piece is on
     * @param checkSafe: if true, will filter out moves putting the pieces king into check
     * 
     * @returns all moves the piece can take (making sure they do not cause check if enabled)
     */
    public abstract getAvailableMoves(board: Board, checkSafe: boolean): Position[] | null;

    public getImageSource(): string {
        return this.color + "_" + this.name + ".png";
    }
}

export class Pawn extends Piece {
    constructor(color: Color) {
        super(Name.Pawn, 1, color)
    }

    public clone(): Pawn {
        const clone = new Pawn(this.color);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const forwardMove: Position = {rank: this.color == Color.White ? currentPosition.rank + 1 : currentPosition.rank - 1, file: currentPosition.file};
        if (board.isPositionValid(forwardMove) && board.getPieceAtPosition(forwardMove) == null) {
            possibleMoves.push(forwardMove);

            const doubleForwardMove: Position = {rank: this.color == Color.White ? currentPosition.rank + 2 : currentPosition.rank - 2, file: currentPosition.file};
            if (((this.color == Color.White && currentPosition.rank == 2) || (this.color == Color.Black && currentPosition.rank == 7)) && board.getPieceAtPosition(doubleForwardMove) == null) {
                possibleMoves.push(doubleForwardMove);
            }
        }

        const captureLeftMove: Position = {rank: this.color == Color.White ? currentPosition.rank + 1 : currentPosition.rank - 1, file: board.numToFile(board.fileToNum(currentPosition.file) + 1)};
        if (board.isPositionValid(captureLeftMove) && board.getPieceAtPosition(captureLeftMove) != null && board.getPieceAtPosition(captureLeftMove)?.color != this.color) {
            possibleMoves.push(captureLeftMove);
        }

        const captureRightMove: Position = {rank: this.color == Color.White ? currentPosition.rank + 1 : currentPosition.rank - 1, file: board.numToFile(board.fileToNum(currentPosition.file) - 1)};
        if (board.isPositionValid(captureRightMove) && board.getPieceAtPosition(captureRightMove) != null && board.getPieceAtPosition(captureRightMove)?.color != this.color) {
            possibleMoves.push(captureRightMove);
        }

        //TODO: En passant

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }
}

export class Knight extends Piece {
    constructor(color: Color) {
        super(Name.Knight, 3, color)
    }

    public clone(): Knight {
        const clone = new Knight(this.color);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const moves = [{rank: 2, file: 1}, {rank: 2, file: -1}, {rank: 1, file: 2}, {rank: 1, file: -2}, {rank: -2, file: 1}, {rank: -2, file: -1}, {rank: -1, file: 2}, {rank: -1, file: -2}]
        for (let move of moves) {
            let movePosition: Position = {rank: currentPosition.rank + move.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + move.file)};
            if (!board.isPositionValid(movePosition)) continue;
            const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
            if (pieceAtMovePosition == null || pieceAtMovePosition.color != this.color) possibleMoves.push(movePosition);
        }

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }
}

export class Rook extends Piece {
    private hasMoved: boolean = false;

    constructor(color: Color, hasMoved: boolean) {
        super(Name.Rook, 5, color);
        this.hasMoved = hasMoved;
    }

    public clone(): Rook {
        const clone = new Rook(this.color, this.hasMoved);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const moveDirections = [{rank: 1, file: 0}, {rank: -1, file: 0}, {rank: 0, file: 1}, {rank: 0, file: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition: Position = {rank: currentPosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + moveDirection.file)};
            while (board.isPositionValid(movePosition)) {
                const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != this.color) possibleMoves.push(movePosition);
                    if (pieceAtMovePosition.color == this.color && pieceAtMovePosition instanceof King && !pieceAtMovePosition.getHasMoved() && !this.hasMoved && (!checkSafe || !board.isKingInCheck(this.color))) possibleMoves.push(movePosition); //Castling
                    break;
                } else {
                    possibleMoves.push(movePosition)
                }
                movePosition = {rank: movePosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(movePosition.file) + moveDirection.file)};
            }
        }

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }

    public markAsMoved(): void {
        this.hasMoved = true;
    }

    public getHasMoved(): boolean {
        return this.hasMoved;
    }
}

export class Bishop extends Piece {
    constructor(color: Color) {
        super(Name.Bishop, 5, color)
    }

    public clone(): Bishop {
        const clone = new Bishop(this.color);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const moveDirections = [{rank: 1, file: 1}, {rank: 1, file: -1}, {rank: -1, file: 1}, {rank: -1, file: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition: Position = {rank: currentPosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + moveDirection.file)};
            while (board.isPositionValid(movePosition)) {
                const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != this.color) possibleMoves.push(movePosition);
                    break;
                } else {
                    possibleMoves.push(movePosition);
                }
                movePosition = {rank: movePosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(movePosition.file) + moveDirection.file)};
            }
        }

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }
}

export class Queen extends Piece {
    constructor(color: Color) {
        super(Name.Queen, 9, color)
    }

    public clone(): Queen {
        const clone = new Queen(this.color);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const moveDirections = [{rank: 1, file: 0}, {rank: -1, file: 0}, {rank: 0, file: 1}, {rank: 0, file: -1}, {rank: 1, file: 1}, {rank: 1, file: -1}, {rank: -1, file: 1}, {rank: -1, file: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition: Position = {rank: currentPosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + moveDirection.file)};
            while (board.isPositionValid(movePosition)) {
                const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != this.color) possibleMoves.push(movePosition);
                    break;
                } else {
                    possibleMoves.push(movePosition);
                }
                movePosition = {rank: movePosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(movePosition.file) + moveDirection.file)};
            }
        }

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }
}

export class King extends Piece {
    private hasMoved: boolean = false;

    constructor(color: Color, hasMoved: boolean) {
        super(Name.King, 0, color);
        this.hasMoved = hasMoved;
    }

    public clone(): King {
        const clone = new King(this.color, this.hasMoved);
        return clone;
    }

    public getAvailableMoves(board: Board, checkSafe: boolean): Position[] {
        const currentPosition = board.getPositionOfPiece(this);
        if (currentPosition == null) throw new Error("Piece Not Found");

        const possibleMoves: Position[] = [];

        const moves = [{rank: 1, file: 0}, {rank: -1, file: 0}, {rank: 0, file: 1}, {rank: 0, file: -1}, {rank: 1, file: 1}, {rank: 1, file: -1}, {rank: -1, file: 1}, {rank: -1, file: -1}]
        for (let move of moves) {
            let movePosition: Position = {rank: currentPosition.rank + move.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + move.file)};
            if (!board.isPositionValid(movePosition)) continue;
            const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
            if (pieceAtMovePosition == null || pieceAtMovePosition.color != this.color) possibleMoves.push(movePosition);
        }

        //Castling
        if (!this.hasMoved) {
            const moveDirections = [{rank: 1, file: 0}, {rank: -1, file: 0}, {rank: 0, file: 1}, {rank: 0, file: -1}]
            for (let moveDirection of moveDirections) {
                let movePosition: Position = {rank: currentPosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(currentPosition.file) + moveDirection.file)};
                while (board.isPositionValid(movePosition)) {
                    const pieceAtMovePosition = board.getPieceAtPosition(movePosition);
                    if (pieceAtMovePosition != null) {
                        if (pieceAtMovePosition.color == this.color && pieceAtMovePosition instanceof Rook && !pieceAtMovePosition.getHasMoved() && (!checkSafe || !board.isKingInCheck(this.color))) possibleMoves.push(movePosition);
                        break;
                    }
                    movePosition = {rank: movePosition.rank + moveDirection.rank, file: board.numToFile(board.fileToNum(movePosition.file) + moveDirection.file)};
                }
            }
        }

        return !checkSafe ? possibleMoves : possibleMoves.filter(move => {
            const simBoard = board.clone();
            simBoard.movePiece(currentPosition, move, false);
            return !simBoard.isKingInCheck(this.color);
        });
    }

    public markAsMoved(): void {
        this.hasMoved = true;
    }

    public getHasMoved(): boolean {
        return this.hasMoved;
    }
}

export enum Color {
    White = "white",
    Black = "black"
}

export enum Name {
    Pawn = "pawn",
    Rook = "rook",
    Knight = "knight",
    Bishop = "bishop",
    Queen = "queen",
    King = "king"
}

//Piece Factories
export const WPawn = (): Piece => (new Pawn(Color.White));
export const WRook = (hasMoved: boolean): Piece => (new Rook(Color.White, hasMoved));
export const WKnight = (): Piece => (new Knight(Color.White));
export const WBishop = (): Piece => (new Bishop(Color.White));
export const WQueen = (): Piece => (new Queen(Color.White));
export const WKing = (hasMoved: boolean): Piece => (new King(Color.White, hasMoved));

export const BPawn = (): Piece => (new Pawn(Color.Black));
export const BRook = (hasMoved: boolean): Piece => (new Rook(Color.Black, hasMoved));
export const BKnight = (): Piece => (new Knight(Color.Black));
export const BBishop = (): Piece => (new Bishop(Color.Black));
export const BQueen = (): Piece => (new Queen(Color.Black));
export const BKing = (hasMoved: boolean): Piece => (new King(Color.Black, hasMoved));