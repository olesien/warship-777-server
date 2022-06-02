/**
 * Socket Controller
 */

const debug = require("debug")("battleship:socket_controller");
let io = null; // socket.io server instance

//matchmaking and game objects
let matchmaking = [];
let games = [];

// Some planning

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

//Find the game
const findGameIndex = (room) => {
	const gameIndex = games.findIndex((game) => game.room === room);

	return gameIndex;
};

//user connected, get these men
const handleConnect = function ({ username, avatar }) {
	console.log(matchmaking);
	console.log(games);
	const player = {
		id: this.id,
		username,
		avatar,
		ready: false,
		gameboard: [],
	};
	debug(player);

	//Add user to matchmaking
	matchmaking.push(player);

	//Check if someone is already waiting. If so, start match
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

		//Send message to both
		this.to(matchmaking[0].id).emit(
			"user:joined",
			`User: ${username} - has connected to ${matchmaking[0].id}`
		);
		//Get reference to the game
		const game = games.find((game) =>
			game.players.find((player) => player.id === this.id)
		);

		//Send this to the clients
		io.to(matchmaking[0].id).emit("players", game);

		// this.broadcast.to(room.id).emit('user:disconnected', room.users[this.id]);

		debug(game);
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

	//Get game reference
	const game = games.find((game) => {
		const playerInRoom = game.players.some(
			(player) => player.id == this.id
		);

		if (playerInRoom) return game;
	});

	//If it exists
	if (game) {
		//Get person who left
		const personWhoLeft = game.players.find(
			(player) => player.id === this.id
		);

		//Send to user
		io.to(game.room).emit("game:leave", personWhoLeft);
		
	}
	//remove matchmaking
	const gameId = games.findIndex((game) => game.room === this.id);
	if (gameId >= 0) {
		games.splice(gameId, 1);
	}

	//Remove from matchmaking if they quit while searching
	if (matchmaking.length > 0) {
		const playerIndex = matchmaking.findIndex(
			(player) => player.id === this.id
		);
		if (playerIndex >= 0) {
			matchmaking.splice(playerIndex, 1);
		}
	}
};

//Player start function
const playerStart = (gameIndex) => {
	const game = games[gameIndex];
	const randomNumber = Math.floor(Math.random() * 2) + 1;

	//Change whos turn it is
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

//One person had readied up
const handleReady = async function (room, gameboard, callback) {
	debug("room: " + room + " socketId: " + this.id);
	//Get game reference
	const gameIndex = findGameIndex(room);
	const game = games[gameIndex];
	//See how many parts have been placed
	const partsPlaced = gameboard.reduce((prevValue, col) => {
		const opponentPartsPlacedInCol = col.reduce((prevValue, row) => {
			if (row.part) {
				return prevValue + 1;
			}
			return prevValue;
		}, 0);
		return prevValue + opponentPartsPlacedInCol;
	}, 0);

	//If less than 11, send back so that they have to put in more
	if (partsPlaced < 11) {
		callback(true);
		return;
	} else {
		callback(false);
	}

	if (!game) {
		return;
	}

	//Get reference on player & opponent
	const players = game.players;
	//Get player index from the players list. <- Player is the person who made this request
	const playerIndex = players.findIndex((player) => player.id === this.id);
	const player = players[playerIndex];
	//opposite of player
	const opponentIndex = playerIndex === 1 ? 0 : 1;
	const opponent = players[opponentIndex];

	games[gameIndex].players[playerIndex].gameboard = gameboard;

	games[gameIndex].players[playerIndex].ready = !player.ready;

	if (player.ready && opponent.ready) {
		//Other person is already ready. Start game.
		console.log("Ready!!!");

		playerStart(gameIndex);
		io.to(room).emit("game:start", games[gameIndex]);

		return;
	}

	//Opponent not ready. Toggle ready state!
	io.to(room).emit("game:peopleready", games[gameIndex].players);
};

//Player made an attempt to hit one in the grid
const handleHit = async function ({ room, columnIndex, rowIndex }) {
	debug("room: " + room + " socketId: " + this.id);
	//Grab reference to the game
	const gameIndex = findGameIndex(room);
	const game = games[gameIndex];
	if (!game) {
		return;
	}

	debug(columnIndex, rowIndex);

	//Grab player / opponent reference
	const players = game.players;
	//Get player index from the players list. <- Player is the person who made this request
	const playerIndex = players.findIndex((player) => player.id === this.id);
	const player = players[playerIndex];
	//opposite of player
	const opponentIndex = playerIndex === 1 ? 0 : 1;
	const opponent = players[opponentIndex];

	const opponentGridItem = opponent.gameboard[columnIndex][rowIndex];
	const playerGridItem = player.gameboard[columnIndex][rowIndex];
	//already been hit/missed
	if (opponentGridItem.hit || opponentGridItem.missed) {
		return;
	}

	//Is the item hit a part of a ship?
	if (opponentGridItem.part) {
		//was a hit!
		opponentGridItem.hit = true;
		handleHitTrue(room);
	} else if (!opponentGridItem.part) {
		//was a miss
		opponentGridItem.missed = true;
		games[gameIndex].idsTurn = opponent.id;
		handleMissTrue(room);
	}

	//Enemy gameb oard
	const opponentGameboard = opponent.gameboard;
	//Game board
	const opponentPartsHit = opponentGameboard.reduce((prevValue, col) => {
		const opponentPartsHitInCol = col.reduce((prevValue, row) => {
			if (row.hit) {
				//row hit
				return prevValue + 1;
			}
			return prevValue;
		}, 0);
		return prevValue + opponentPartsHitInCol;
	}, 0);

	const playerGameboard = player.gameboard;

	//Game board
	const playerPartsHit = playerGameboard.reduce((prevValue, col) => {
		const playerPartsHitInCol = col.reduce((prevValue, row) => {
			if (row.hit) {
				//row hit
				return prevValue + 1;
			}
			return prevValue;
		}, 0);
		return prevValue + playerPartsHitInCol;
	}, 0);
	console.log(playerPartsHit);

	//Are now over 10 parts hit? If so end game
	if (opponentPartsHit >= 11) {
		console.log("game over");
		io.to(room).emit("game:over", player);
	} else if (playerPartsHit >= 11) {
		console.log("game over");
		io.to(room).emit("game:over", opponent);
	}

	//update it!
	games[gameIndex].players[opponentIndex].gameboard[columnIndex][rowIndex] =
		opponentGridItem;

	games[gameIndex].players[playerIndex].gameboard[columnIndex][rowIndex] =
		playerGridItem;

	io.to(room).emit("game:handleHit", games[gameIndex]);
};

//Used for sound effects
const handleHitTrue = async function (room) {
	io.to(room).emit("game:handleHitTrue");
};

//Used for sound effects
const handleMissTrue = async function (room) {
	io.to(room).emit("game:handleMissTrue");
};

//Used for chat
const handleMessage = async function (data) {
	console.log(data);

	io.to(data.room).emit("chat:message", data);
};

//If user wants to replay
const handleReplay = function (room, grid, awaitPlayers) {
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

	if (awaitPlayers === 2) {
		// Reset players gameboards
		player.gameboard = [];
		opponent.gameboard = [];

		// Reset players ready-state
		player.ready = false;
		opponent.ready = false;
	}

	//Send replay
	io.to(room).emit("game:replay", awaitPlayers);
	playerStart(gameIndex);
};

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

	// person hits player's ship
	socket.on("game:handleHitTrue", handleHitTrue);

	// person miss player's ship
	socket.on("game:handleMissTrue", handleMissTrue);

	// play again
	socket.on("game:replay", handleReplay);

	// handle user sending message
	socket.on("chat:message", handleMessage);
};
