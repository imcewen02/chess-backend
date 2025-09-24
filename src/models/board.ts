import { ApiError } from "../utils/ApiError";
import { MoveSet } from "./moveSet";
import { BBishop, BKing, BKnight, BPawn, BQueen, BRook, Piece, WBishop, WKing, WKnight, WPawn, WQueen, WRook } from "./piece";
import { Position } from "./position";

export class Board {
    private squares: (Piece | null) [][];

    constructor() {
        this.squares = [
            [WRook(), WKnight(), WBishop(), WQueen(), WKing(), WBishop(), WKnight(), WRook()],
            [WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn()],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn()],
            [BRook(), BKnight(), BBishop(), BQueen(), BKing(), BBishop(), BKnight(), BRook()]
        ]
    }

    /**
     * Gets all legal moves of a given color based on the current state of the board
     * 
     * @param color: the color to fetch all moves for
     */
    public getCurrentMoveOptions(color: "white" | "black"): MoveSet[] {
        const moveOptions: MoveSet[] = [];

        for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            for (let colIdx = 0; colIdx < 8; colIdx++) {
                const position = {row: rowIdx, col: colIdx};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition == null || pieceAtPosition.color != color) continue;
                moveOptions.push({
                    origin: position,
                    destinations: this.getMovesFromPosition(position, true)
                })
            }
        }

        return moveOptions;
    }

    /**
     * Moves the piece at the origin to the destination
     * 
     * @param origin the origin of the moving piece
     * @param destination the destination of the moveing piece
     */
    public movePiece(origin: Position, destination: Position): void {
        const movingPiece = this.getPieceAtPosition(origin);
        if (movingPiece == null) throw new ApiError(400, "Move Illegal");

        const legalMoves = this.getMovesFromPosition(origin, true);
        if (!legalMoves.some(position => position.row == destination.row && position.col == destination.col)) throw new ApiError(400, "Move Illegal");

        this.squares[destination.row][destination.col] = this.getPieceAtPosition(origin);
        this.squares[origin.row][origin.col] = null;
    }

    /**
     * Checks if the given position exists on the board or not
     *
     * @param position: the position to check
     * 
     * @returns wether the position is valid or not
     */
    private isPositionValid(position: Position): boolean {
        return 0 <= position.col && position.col < 8 && 0 <= position.row && position.row < 8
    }

    /**
     * Checks if the given king of the given color is currently in check or not
     *
     * @param color: the color of the king to check
     * 
     * @returns wether the king is in check or not
     */
    private isKingInCheck(color: "white" | "black"): boolean {
        const opposingPiecesRange: Position[] = [];
        let kingsPosition: Position = null!;

        for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            for (let colIdx = 0; colIdx < 8; colIdx++) {
                const pieceAtPosition = this.getPieceAtPosition({row: rowIdx, col: colIdx});
                if (pieceAtPosition == null) continue;

                if (pieceAtPosition.color != color) {
                    opposingPiecesRange.push(...this.getMovesFromPosition({row: rowIdx, col: colIdx}, false));
                }

                if (pieceAtPosition.name == "king" && pieceAtPosition.color == color) {
                    kingsPosition = {row: rowIdx, col: colIdx};
                }
            }
        }

        return opposingPiecesRange.some(position => position.row == kingsPosition.row && position.col == kingsPosition.col);
    }

    /**
     * Feteches the piece at the specfied position.
     * Silently handles invalid positions by returning null
     * 
     * @param position: the position to get the piece from
     * 
     * @returns the piece at the given position or null
     */
    private getPieceAtPosition(position: Position): Piece | null {
        return this.isPositionValid(position) ? this.squares[position.row][position.col] : null;
    }

    /**
     * Feteches the piece at the specfied position and returns the pieces possible moves.
     * Will filter out moves putting the picees king into check if checkSafe is enabled
     * Silently handles invalid positions by returning an empty list
     * 
     * @param position: the position to get the piece from
     * @param checkSafe: if true, will filter out moves putting the pieces king into check
     * 
     * @returns all moves the piece at the given position can take (making sure they do not cause check if enabled)
     */
    private getMovesFromPosition(position: Position, checkSafe: boolean): Position[] {
        const movingPiece = this.getPieceAtPosition(position);
        if (movingPiece == null) return [];

        let possibleMoves: Position[] = [];
        switch (movingPiece.name) {
            case "pawn": possibleMoves = this.getPawnMovesFromPosition(movingPiece.color, position); break;
            case "rook": possibleMoves = this.getRookMovesFromPosition(movingPiece.color, position); break;
            case "knight": possibleMoves = this.getKnightMovesFromPosition(movingPiece.color, position); break;
            case "bishop": possibleMoves = this.getBishopMovesFromPosition(movingPiece.color, position); break;
            case "queen": possibleMoves = this.getQueenMovesFromPosition(movingPiece.color, position); break;
            case "king": possibleMoves = this.getKingMovesFromPosition(movingPiece.color, position); break;
        }

        if (!checkSafe) return possibleMoves;

        possibleMoves = possibleMoves.filter( move => {
            const simulatedBoard = this.clone();
            simulatedBoard.squares[move.row][move.col] = simulatedBoard.squares[position.row][position.col];
            simulatedBoard.squares[position.row][position.col] = null;
            return !simulatedBoard.isKingInCheck(movingPiece.color);
        });

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a pawn of the given color could do from the given position.
     * Does not consider if the piece is protecting the king
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the pawn could achieve
     */
    private getPawnMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const forwardMove = {row: color == "white" ? position.row + 1 : position.row - 1, col: position.col};
        if (this.isPositionValid(forwardMove) && this.getPieceAtPosition(forwardMove) == null) {
            possibleMoves.push(forwardMove);

            const doubleForwardMove = {row: color == "white" ? position.row + 2 : position.row - 2, col: position.col};
            if (((color == "white" && position.row == 1) || (color == "black" && position.row == 6)) &&this.getPieceAtPosition(doubleForwardMove) == null) {
                possibleMoves.push(doubleForwardMove);
            }
        }

        const captureLeftMove = {row: color == "white" ? position.row + 1 : position.row - 1, col: position.col + 1};
        if (this.isPositionValid(captureLeftMove) && this.getPieceAtPosition(captureLeftMove) != null && this.getPieceAtPosition(captureLeftMove)?.color != color) {
            possibleMoves.push(captureLeftMove);
        }

        const captureRightMove = {row: color == "white" ? position.row + 1 : position.row - 1, col: position.col - 1};
        if (this.isPositionValid(captureRightMove) && this.getPieceAtPosition(captureRightMove) != null && this.getPieceAtPosition(captureRightMove)?.color != color) {
            possibleMoves.push(captureRightMove);
        }

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a rook of the given color could do from the given position.
     * Does not consider if the piece is protecting the king
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the rook could achieve
     */
    private getRookMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const moveDirections: Position[] = [{row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition = {row: position.row + moveDirection.row, col: position.col + moveDirection.col};
            while (this.isPositionValid(movePosition)) {
                const pieceAtMovePosition = this.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != color) possibleMoves.push(movePosition);
                    break;
                } else {
                    possibleMoves.push(movePosition)
                }
                movePosition = {row: movePosition.row + moveDirection.row, col: movePosition.col + moveDirection.col};
            }
        }

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a knight of the given color could do from the given position.
     * Does not consider if the piece is protecting the king
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the knight could achieve
     */
    private getKnightMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const moves: Position[] = [{row: 2, col: 1}, {row: 2, col: -1}, {row: 1, col: 2}, {row: 1, col: -2}, {row: -2, col: 1}, {row: -2, col: -1}, {row: -1, col: 2}, {row: -1, col: -2}]
        for (let move of moves) {
            let movePosition = {row: position.row + move.row, col: position.col + move.col};
            if (!this.isPositionValid(movePosition)) continue;
            const pieceAtMovePosition = this.getPieceAtPosition(movePosition);
            if (pieceAtMovePosition == null || pieceAtMovePosition.color != color) possibleMoves.push(movePosition);
        }

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a bishop of the given color could do from the given position.
     * Does not consider if the piece is protecting the king
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the bishop could achieve
     */
    private getBishopMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const moveDirections: Position[] = [{row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition = {row: position.row + moveDirection.row, col: position.col + moveDirection.col};
            while (this.isPositionValid(movePosition)) {
                const pieceAtMovePosition = this.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != color) possibleMoves.push(movePosition);
                    break;
                } else {
                    possibleMoves.push(movePosition);
                }
                movePosition = {row: movePosition.row + moveDirection.row, col: movePosition.col + moveDirection.col};
            }
        }

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a queen of the given color could do from the given position.
     * Does not consider if the piece is protecting the king
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the queen could achieve
     */
    private getQueenMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const moveDirections: Position[] = [{row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}, {row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}]
        for (let moveDirection of moveDirections) {
            let movePosition = {row: position.row + moveDirection.row, col: position.col + moveDirection.col};
            while (this.isPositionValid(movePosition)) {
                const pieceAtMovePosition = this.getPieceAtPosition(movePosition);
                if (pieceAtMovePosition != null) {
                    if (pieceAtMovePosition.color != color) possibleMoves.push(movePosition);
                    break;
                } else {
                    possibleMoves.push(movePosition);
                }
                movePosition = {row: movePosition.row + moveDirection.row, col: movePosition.col + moveDirection.col};
            }
        }

        return possibleMoves;
    }

    /**
     * Fetches the possible moves a king of the given color could do from the given position.
     * Does not Does not consider if this puts the king into check
     * 
     * @param color: the color of the moving piece
     * @param position: the origin of the moving piece
     * 
     * @returns all possible moves the king could achieve
     */
    private getKingMovesFromPosition(color: "white" | "black", position: Position): Position[] {
        const possibleMoves: Position[] = [];

        const moves: Position[] = [{row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}, {row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}]
        for (let move of moves) {
            let movePosition = {row: position.row + move.row, col: position.col + move.col};
            if (!this.isPositionValid(movePosition)) continue;
            const pieceAtMovePosition = this.getPieceAtPosition(movePosition);
            if (pieceAtMovePosition == null || pieceAtMovePosition.color != color) possibleMoves.push(movePosition);
        }

        return possibleMoves;
    }

    /**
     * Clones the existing board for consequence free muatations, guranteed!
     * 
     * @returns the cloned board
     */
    private clone(): Board {
        const newBoard = new Board();
        newBoard.squares = this.squares.map( row => row.map(piece => piece ? { ...piece } : null) );
        return newBoard;
    }
}