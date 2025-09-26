import { Bishop, Color, King, Knight, Pawn, Piece, Queen, Rook } from "./pieces";
import { Position } from "./position";

export class Board {
    public readonly ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    public readonly files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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
     * Clones the existing board for consequence free muatations, guranteed!
     * 
     * @returns the cloned board
     */
    public clone(): Board {
        const newBoard = new Board();
        newBoard.squares = this.squares.map(rank => rank.map(piece => piece ?  piece.clone() : null));
        return newBoard;
    }

    /**
     * Moves the piece at the origin to the destination
     * 
     * @param origin the origin of the moving piece
     * @param destination the destination of the moveing piece
     * @param checkLegal wether to check that the move is legal and check safe (should only be used for simulated moves)
     */
    public movePiece(origin: Position, destination: Position, checkLegal: boolean): void {
        const movingPiece = this.getPieceAtPosition(origin);
        if (movingPiece == null) throw new Error("No Piece at Origin");
        if (checkLegal && !movingPiece.getAvailableMoves(this, true)!.some(move => move.rank == destination.rank && move.file == destination.file)) throw new Error("Move Is Illegal");

        this.squares[destination.rank - 1][this.fileToNum(destination.file)] = movingPiece;
        this.squares[origin.rank - 1][this.fileToNum(origin.file)] = null;
    }

    /**
     * Checks if the given position exists on the board or not
     *
     * @param position: the position to check
     * 
     * @returns wether the position is valid or not
     */
    public isPositionValid(position: Position): boolean {
        return this.ranks.includes(position.rank) && this.files.includes(position.file);
    }

    /**
     * Finds the position of the piece by reference
     * 
     * @param picee: the piece to find
     * 
     * @returns the position of the piece or null if the piece is not found
     */
    public getPositionOfPiece(picee: Piece): Position | null {
        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition == picee) return position;
            }
        }

        return null;
    }

    /**
     * Feteches the piece at the specfied position.
     * Silently handles invalid positions by returning null
     * 
     * @param position: the position to get the piece from
     * 
     * @returns the piece at the given position or null
     */
    public getPieceAtPosition(position: Position): Piece | null {
        return this.isPositionValid(position) ? this.squares[position.rank - 1][this.fileToNum(position.file)] : null;
    }

    /**
     * Checks if the king of the given color is currently in check
     *
     * @param color: the color of the king to check
     * 
     * @returns if the king is in check
     */
    public isKingInCheck(color: Color): boolean {
        let kingsPosition: Position = null!;
        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition && pieceAtPosition.color == color && pieceAtPosition instanceof King) kingsPosition = position;
            }
        }

        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition && pieceAtPosition.color != color && pieceAtPosition.getAvailableMoves(this, false)?.some(move => move.rank == kingsPosition.rank && move.file == kingsPosition.file)) return true;
            }
        }

        return false;
    }

    /**
     * Checks if the king of the given color is currently in checkmate
     *
     * @param color: the color of the king to check
     * 
     * @returns if the king is in checkmate
     */
    public isKingInCheckmate(color: Color): boolean {
        if (!this.isKingInCheck(color)) return false;

        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition && pieceAtPosition.color == color && pieceAtPosition.getAvailableMoves(this, true)!.length > 0) return false; //if there is any legal move, the king is not in checkmate
            }
        }

        return true;
    }

    /**
     * Converts a file from its string representation to its numeric representation
     * Will return -1 if the file is not found
     *
     * @param file: the file to find
     * 
     * @returns the numerice representation of the file (or -1 if its not found)
     */
    public fileToNum(file: string): number {
        return this.files.indexOf(file);
    }

    /**
     * Converts a file from its numeric representation to its string representation
     * Will return "" if the file is not found
     *
     * @param file: the file to find
     * 
     * @returns the string representation of the file (or "" if its not found)
     */
    public numToFile(num: number): string {
        return 0 <= num && num < this.files.length ? this.files[num] : "";
    }
}

//Piece Factories
const WPawn = (): Piece => (new Pawn(Color.White));
const WRook = (): Piece => (new Rook(Color.White));
const WKnight = (): Piece => (new Knight(Color.White));
const WBishop = (): Piece => (new Bishop(Color.White));
const WQueen = (): Piece => (new Queen(Color.White));
const WKing = (): Piece => (new King(Color.White));
const BPawn = (): Piece => (new Pawn(Color.Black));
const BRook = (): Piece => (new Rook(Color.Black));
const BKnight = (): Piece => (new Knight(Color.Black));
const BBishop = (): Piece => (new Bishop(Color.Black));
const BQueen = (): Piece => (new Queen(Color.Black));
const BKing = (): Piece => (new King(Color.Black));