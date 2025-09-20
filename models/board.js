class Board {
	constructor() {
		this.squares = {};

		const files = ['A','B','C','D','E','F','G','H'];
		const ranks = ['1','2','3','4','5','6','7','8'];

		for (const file of files) {
			for (const rank of ranks) {
				this.squares[`${file}${rank}`] = null;
			}
		}
	
		this.squares['A1'] = {username: 'rook', color: 'white'};
		this.squares['B1'] = {username: 'knight', color: 'white'};
		this.squares['C1'] = {username: 'bishop', color: 'white'};
		this.squares['D1'] = {username: 'queen', color: 'white'};
		this.squares['E1'] = {username: 'king', color: 'white'};
		this.squares['F1'] = {username: 'bishop', color: 'white'};
		this.squares['G1'] = {username: 'knight', color: 'white'};
		this.squares['H1'] = {username: 'rook', color: 'white'};

		this.squares['A2'] = {username: 'pawn', color: 'white'};
		this.squares['B2'] = {username: 'pawn', color: 'white'};
		this.squares['C2'] = {username: 'pawn', color: 'white'};
		this.squares['D2'] = {username: 'pawn', color: 'white'};
		this.squares['E2'] = {username: 'pawn', color: 'white'};
		this.squares['F2'] = {username: 'pawn', color: 'white'};
		this.squares['G2'] = {username: 'pawn', color: 'white'};
		this.squares['H2'] = {username: 'pawn', color: 'white'};
		
		this.squares['A8'] = {username: 'rook', color: 'black'};
		this.squares['B8'] = {username: 'knight', color: 'black'};
		this.squares['C8'] = {username: 'bishop', color: 'black'};
		this.squares['D8'] = {username: 'queen', color: 'black'};
		this.squares['E8'] = {username: 'king', color: 'black'};
		this.squares['F8'] = {username: 'bishop', color: 'black'};
		this.squares['G8'] = {username: 'knight', color: 'black'};
		this.squares['H8'] = {username: 'rook', color: 'black'};

		this.squares['A7'] = {username: 'pawn', color: 'black'};
		this.squares['B7'] = {username: 'pawn', color: 'black'};
		this.squares['C7'] = {username: 'pawn', color: 'black'};
		this.squares['D7'] = {username: 'pawn', color: 'black'};
		this.squares['E7'] = {username: 'pawn', color: 'black'};
		this.squares['F7'] = {username: 'pawn', color: 'black'};
		this.squares['G7'] = {username: 'pawn', color: 'black'};
		this.squares['H7'] = {username: 'pawn', color: 'black'};
	}
}

module.exports = Board;