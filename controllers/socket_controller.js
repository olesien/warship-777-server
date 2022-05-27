/**
 * Socket Controller
 */

const debug = require("debug")("battleship:socket_controller");
let io = null; // socket.io server instance

let matchmaking = [];
let games = [];

// usersSearching and game object

/**
 * Start game function (step 2)
 * -> Add users to a room (could be based on the first person to match)
 * -> Send out a message to both users that will lead to them being placed in the game board
 * --> VG: Allow users to place out their battleships (and control with the backend).
 * --> G: Send a predefined board to both users for testing
 * ->
 */

/**
 * Game ended? (step 5)
 * -> One user no longer has a fleet left. Send message to both users that the game has ended, and who won. Display how many ships the winner had left, how long it took (just do a Date.now() on the game itself when it starts),
 * Clean the game object, remove users to room
 * -> Allow for both users to retry. If both are pressed, then just chuck both users back into the game object again. (see step 2)
 *
 */

/**
 * Handle a user searching for a match (step 1)
 * -> If the "usersSearching" object is empty, add the user searching to it
 * -> If there is anyone in "usersSearching", add both users to "game" object. Then initiate startGame
 * -> Remove from "usersSearching" if a match is found
 */

/**
 * User ready to start (step 2.5)
 * -> When ready button is pressed, change the state of that user in ther game function to "ready". Check if both are ready. If so, start the game. For other person say waiting for <user>
 * -> Randomize who starts, send message to both who starts and allow that player to make their move.
 *
 */

/**
 * Player pressed (step 3)
 * -> When ready button is pressed, change the state of that user in ther game function to "ready". Check if both are ready. If so, start the game. For other person say waiting for <user>
 * -> Randomize who starts, send message to both who starts and allow that player to make their move.
 *
 */

/**
 * User guessed position (step 4)
 * -> If it's really that users turn, check with the built up array-in-array map in the game object to see if it was a hit. If it was a hit, check the "isHit" state on that position
 * Then also check if an entire ship is sunk, and send to both users that it was hit successfully (and also if an entire ship was sunk). Also allow the user to make another move!
 * -> Check if the enemy has any ships left. If not, end game
 *
 */

/**
 * Chat (step X)
 * -> Send a chat message from client. Username not needed (can just say opponent)
 * -> Receive a chat message and send it further to all in that room
 *
 */
const findGameIndex = (room) => {
	const gameIndex = games.findIndex((game) => game.room === room);

	return gameIndex;
};

const handleConnect = function ({ username, avatar }) {
	const player = {
		id: this.id,
		username,
		avatar,
		boats: [
			{
				type: "Sloop",
				hp: 2,
			},
			{
				type: "Cutter",
				hp: 2,
			},
			{
				type: "War Brig",
				hp: 3,
			},
			{
				type: "Grand Frigate",
				hp: 4,
			},
		],
		ready: false,
		gameboard: [],
	};
	console.log("PLAYER", player);

	matchmaking.push(player);
	// matchmaking.push(player)

	// game.room = players[0].id

	if (matchmaking.length === 1) {
		let game = {
			room: player.id,
			idsTurn: null,
			players: matchmaking,
		};

		games.push(game);
	}

	this.join(matchmaking[0].id);

	// if 2, start the game
	if (matchmaking.length > 1) {
		debug(`User: "${username}" has connected with client id: ${this.id}`);
		// this.broadcast.emit("user:joined", `User: ${username} - has connected`)
		this.to(matchmaking[0].id).emit(
			"user:joined",
			`User: ${username} - has connected to ${matchmaking[0].id}`
		);
		const game = games.find((game) =>
			game.players.find((player) => player.id === this.id)
		);
		io.to(matchmaking[0].id).emit("players", game);

		// this.broadcast.to(room.id).emit('user:disconnected', room.users[this.id]);

		// push this game into the games array
		console.log(game);
		// empty the global players array
		matchmaking = [];
	}
};

/**
 * Handle a user disconnecting
 *
 */
const handleDisconnect = function () {
	debug(`Client ${this.id} disconnected :(`);

	const game = games.find((game) => {
		const playerInRoom = game.players.some(
			(player) => player.id == this.id
		);

		if (playerInRoom) return game;
	});

	if (game) {
		const personWhoLeft = game.players.find(
			(player) => player.id === this.id
		);

		io.to(game.room).emit("game:leave", personWhoLeft);
	}
	//remove matchmaking

	if (matchmaking.length > 0) {
		const playerIndex = matchmaking.findIndex(
			(player) => player.id === this.id
		);
		matchmaking.splice(playerIndex, 1);
	}


	// const game = games.find(game => game.room.includes(this.id))
	// this.to(game).emit("user:disconnect", 'Your opponent has left the building')
	// console.log(game)
	// delete game.players[this.id];
};

/**
 * Handle a user sending a test message <-- This will be deleted
 *
 */
const handleHello = async function (data) {
	debug("Someone said something: ", data);
};

const playerStart = (gameIndex) => {
	const game = games[gameIndex];
	const randomNumber = Math.floor(Math.random() * 2) + 1;

	console.log(randomNumber - 1);

	games[gameIndex].idsTurn = game.players[randomNumber - 1].id;

	return randomNumber === 1
		? io.to(game.room).emit("player:start", {
				player: game.players[0].username,
				msg: `Player ${game.players[0].username} starts`,
		  })
		: io.to(game.room).emit("player:start", {
				player: game.players[1].username,
				msg: `Player ${game.players[1].username} starts`,
		  });
};

const handleReady = async function (room, gameboard) {
	debug("room: " + room + " socketId: " + this.id);
	const gameIndex = findGameIndex(room);
	const game = games[gameIndex];
	if (!game) {
		return;
	}

	const players = game.players;
	//Get player index from the players list. <- Player is the person who made this request
	const playerIndex = players.findIndex((player) => player.id === this.id);
	const player = players[playerIndex];
	//opposite of player
	const opponentIndex = playerIndex === 1 ? 0 : 1;
	const opponent = players[opponentIndex];

	games[gameIndex].players[playerIndex].gameboard = gameboard;

	games[gameIndex].players[playerIndex].ready = !player.ready;

	if (opponent.ready) {
		//Other person is already ready. Start game.
		console.log("Ready!!!");
		playerStart(gameIndex);
		io.to(room).emit("game:start", games[gameIndex]);

		return;
	}

	console.log("not ready");
	//Opponent not ready. Toggle ready state!
	io.to(room).emit("game:peopleready", games[gameIndex].players);

	console.log(games[gameIndex].players[playerIndex]);
	console.log(games[gameIndex].players[opponentIndex]);
};

const handleHit = async function ({ room, columnIndex, rowIndex }) {
	debug("room: " + room + " socketId: " + this.id);
	const gameIndex = findGameIndex(room);
	const game = games[gameIndex];
	if (!game) {
		return;
	}

	console.log(columnIndex, rowIndex);

	const players = game.players;
	//Get player index from the players list. <- Player is the person who made this request
	const playerIndex = players.findIndex((player) => player.id === this.id);
	const player = players[playerIndex];
	//opposite of player
	const opponentIndex = playerIndex === 1 ? 0 : 1;
	const opponent = players[opponentIndex];

	const gridItem = opponent.gameboard[columnIndex][rowIndex];
	//already been hit/missed
	if (gridItem.hit || gridItem.missed) {
		return;
	}
	console.log(
		games[gameIndex].players[opponentIndex].gameboard[columnIndex][rowIndex]
	);

	if (gridItem.part) {
		//was a hit!
		gridItem.hit = true;
	} else {
		//was a miss
		gridItem.missed = true;
		games[gameIndex].idsTurn = opponent.id;
	}

	const gameboard = opponent.gameboard;
	// console.log(gridItem)

	const partsHit = gameboard.reduce((prevValue, col) => {
		const partsHitInCol = col.reduce((prevValue, row) => {
				if (row.hit) {
						//row hit
						return prevValue + 1;
				}
				return prevValue;
		}, 0);
		return prevValue + partsHitInCol;
	}, 0);
	console.log(partsHit);
	if (partsHit >= 4) {
		console.log("game over");
		// console.log("GAMES:BEFORE", games)
		io.to(room).emit("game:over", player)
		// games.splice(gameIndex, 1)
		// console.log("GAMES:AFTER", games)
	}

	//update it!
	games[gameIndex].players[opponentIndex].gameboard[columnIndex][rowIndex] =
		gridItem;

	// console.log(
	// 	games[gameIndex].players[opponentIndex].gameboard[columnIndex][rowIndex]
	// );

	io.to(room).emit("game:handleHit", games[gameIndex]);
};


	const handleReplay = function (room) {
		const gameIndex = findGameIndex(room);
		const game = games[gameIndex];
		if (!game) {
			return;
		}
	
		const players = game.players;
		//Get player index from the players list. <- Player is the person who made this request
		const playerIndex = players.findIndex((player) => player.id === this.id);
		const player = players[playerIndex];
		//opposite of player
		const opponentIndex = playerIndex === 1 ? 0 : 1;
		const opponent = players[opponentIndex];
	
		console.log(game)
		console.log(room)
		console.log("PLAYER:BEFORE", player)
		console.log("OPPONENT:BEFORE", opponent)
		// Reset players gameboards
		player.gameboard = []
		opponent.gameboard = []

		// resets players ready-state
		player.ready = false
		opponent.ready = false

		console.log("PLAYER:AFTER", player)
		console.log("OPPONENT:AFTER", opponent)

		playerStart(gameIndex);

	}





/**
 * Export controller and attach handlers to events
 *
 */
module.exports = function (socket, _io) {
	// save a reference to the socket.io server instance
	io = _io;

	socket.on("user:joined", handleConnect);

	// handle user disconnect
	socket.on("disconnect", handleDisconnect);

	// person ready
	socket.on("user:ready", handleReady);

	// person hit
	socket.on("user:hit", handleHit);

	// play again
	socket.on("game:replay", handleReplay);

	// handle hello
	socket.on("user:hello", handleHello);
};
