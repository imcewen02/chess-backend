import { BBishop, BKing, BKnight, BPassingPawn, BPawn, BQueen, BRook, Color, King, Name, Piece, WBishop, WKing, WKnight, WPassingPawn, WPawn, WQueen, WRook } from "./pieces";
import { Position } from "./position";

export class Board {
    public readonly ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    public readonly files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    private squares: (Piece | null) [][];

    constructor(jsonSquares: (Piece | null) [][] | null) {
		if (jsonSquares) {
			this.squares = jsonSquares.map(rank =>
				rank.map(pieceJson => {
					if (!pieceJson) return null;
					switch (pieceJson.name) {
						case Name.Pawn: return pieceJson.color == Color.White ? WPawn() : BPawn();
                        case Name.PassingPawn: return pieceJson.color == Color.White ? WPassingPawn() : BPassingPawn();
						case Name.Rook: return pieceJson.color == Color.White ? WRook((pieceJson as any).hasMoved) : BRook((pieceJson as any).hasMoved);
						case Name.Knight: return pieceJson.color == Color.White ? WKnight() : BKnight();
						case Name.Bishop: return pieceJson.color == Color.White ? WBishop() : BBishop();
						case Name.Queen: return pieceJson.color == Color.White ? WQueen() : BQueen();
						case Name.King: return pieceJson.color == Color.White ? WKing((pieceJson as any).hasMoved) : BKing((pieceJson as any).hasMoved);
						default: throw new Error(`Unknown piece type: ${pieceJson.name}`);
					}
				})
			);
		} else {
			this.squares = [
				[WRook(false), WKnight(), WBishop(), WQueen(), WKing(false), WBishop(), WKnight(), WRook(false)],
				[WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn(), WPawn()],
				[null, null, null, null, null, null, null, null],
				[null, null, null, null, null, null, null, null],
				[null, null, null, null, null, null, null, null],
				[null, null, null, null, null, null, null, null],
				[BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn(), BPawn()],
				[BRook(false), BKnight(), BBishop(), BQueen(), BKing(false), BBishop(), BKnight(), BRook(false)]
			]
		}
    }

    /**
     * Clones the existing board for consequence free muatations, guranteed!
     * 
     * @returns the cloned board
     */
    public clone(): Board {
        const newBoard = new Board(this.squares);
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

        const capturedPiece = this.getPieceAtPosition(destination);
        if (movingPiece.color == capturedPiece?.color) {
            //Castling
            this.squares[origin.rank - 1][this.fileToNum(origin.file)] = null;
            this.squares[destination.rank - 1][this.fileToNum(destination.file)] = null;

            if (origin.file == 'A' || destination.file == 'A') {
                this.squares[origin.rank - 1][this.fileToNum('C')] = movingPiece.color == Color.White ? WKing(true) : BKing(true);
                this.squares[origin.rank - 1][this.fileToNum('D')] = movingPiece.color == Color.White ? WRook(true) : BRook(true);
            } else {
                this.squares[origin.rank - 1][this.fileToNum('G')] = movingPiece.color == Color.White ? WKing(true) : BKing(true);
                this.squares[origin.rank - 1][this.fileToNum('F')] = movingPiece.color == Color.White ? WRook(true) : BRook(true);
            }
        } else if (movingPiece.name == Name.Pawn && Math.abs(origin.rank - destination.rank) == 2) {
            //Pawn Moving Two (leave a passing pawn)
            this.squares[origin.rank - 1][this.fileToNum(origin.file)] = null;
            this.squares[movingPiece.color == Color.White ? 2 : 5][this.fileToNum(destination.file)] = movingPiece.color == Color.White ? WPassingPawn() : BPassingPawn();
            this.squares[destination.rank - 1][this.fileToNum(destination.file)] = movingPiece;
        } else if (movingPiece.name == Name.Pawn && capturedPiece == null) {
            //Capture a Passing Pawn
            this.squares[origin.rank - 1][this.fileToNum(origin.file)] = null;
            this.squares[destination.rank - 1 + (movingPiece.color == Color.White ? -1 : 1)][this.fileToNum(destination.file)] = null; // capture the passed pawn
            this.squares[destination.rank - 1][this.fileToNum(destination.file)] = movingPiece;
        } else {
            //Normal Move
            this.squares[origin.rank - 1][this.fileToNum(origin.file)] = null;
            this.squares[destination.rank - 1][this.fileToNum(destination.file)] = movingPiece;
        }

        this.clearAllPassingPawns(movingPiece.color == Color.White ? Color.Black : Color.White);
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
     * @param piece: the piece to find
     * 
     * @returns the position of the piece or null if the piece is not found
     */
    public getPositionOfPiece(piece: Piece): Position | null {
        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition == piece) return position;
            }
        }

        return null;
    }

    /**
     * Feteches the piece at the specfied position.
     * Silently handles invalid positions by returning null
     * 
     * @param position: the position to get the piece from
     * @param returnPassingPawns: optional paramter, which will include passing pawns if true
     * 
     * @returns the piece at the given position or null
     */
    public getPieceAtPosition(position: Position, returnPassingPawns?: boolean): Piece | null {
        if (!this.isPositionValid(position)) return null;

        const pieceAtPosition = this.squares[position.rank - 1][this.fileToNum(position.file)];
        if (pieceAtPosition?.name == Name.PassingPawn && returnPassingPawns != true) return null;
        return pieceAtPosition;
    }

    /**
     * Feteches all the pieces of the given color
     * 
     * @param color: The color of the pieces to get
     * 
     * @returns the pieces of the given color
     */
    public getPiecesByColor(color: Color): Piece[] {
        const piecesOfColor: Piece[] = [];

        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition?.color == color) piecesOfColor.push(pieceAtPosition);
            }
        }

        return piecesOfColor;
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
     * Removes all passing pawns from the board
     *
     * @param color: the color of the passing pawns to remove
     */
    private clearAllPassingPawns(color: Color): void {
        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position, true);
                if (pieceAtPosition?.color == color && pieceAtPosition?.name == Name.PassingPawn) this.squares[position.rank - 1][this.fileToNum(position.file)] = null;
            }
        }
    }

    /**
     * Checks if the player of the given color has any possible moves
     *
     * @param color: the color of the player to check
     * 
     * @returns if the player has any possible lagel moves
     */
    public doesColorHaveAnyMoves(color: Color): boolean {
        for (let rank of this.ranks) {
            for (let file of this.files) {
                const position: Position = {rank: rank, file: file};
                const pieceAtPosition = this.getPieceAtPosition(position);
                if (pieceAtPosition && pieceAtPosition.color == color && pieceAtPosition.getAvailableMoves(this, true)!.length > 0) return true; //any possible legal move means no stalemate
            }
        }

        return false;
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