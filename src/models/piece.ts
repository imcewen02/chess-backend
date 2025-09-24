export type Piece = {
    name: "pawn" | "rook" | "knight" | "bishop" | "king" | "queen";
    color: "white" | "black";
}

export const WPawn = (): Piece => ({ name: "pawn", color: "white" });
export const WRook = (): Piece => ({ name: "rook", color: "white" });
export const WKnight = (): Piece => ({ name: "knight", color: "white" });
export const WBishop = (): Piece => ({ name: "bishop", color: "white" });
export const WQueen = (): Piece => ({ name: "queen", color: "white" });
export const WKing = (): Piece => ({ name: "king", color: "white" });

export const BPawn = (): Piece => ({ name: "pawn", color: "black" });
export const BRook = (): Piece => ({ name: "rook", color: "black" });
export const BKnight = (): Piece => ({ name: "knight", color: "black" });
export const BBishop = (): Piece => ({ name: "bishop", color: "black" });
export const BQueen = (): Piece => ({ name: "queen", color: "black" });
export const BKing = (): Piece => ({ name: "king", color: "black" });