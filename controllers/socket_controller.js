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
const handleConnect = function (username) {
	const player = {
		id: this.id,
		username: username,
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
	};
	console.log("PLAYER", player);

	matchmaking.push(player);
	// matchmaking.push(player)

	// game.room = players[0].id
	if (matchmaking.length === 1) {
		let game = {
			room: player.id,
			players: matchmaking,
			ready: 0,
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
		io.to(matchmaking[0].id).emit("players", "There's 2 players");

		// this.broadcast.to(room.id).emit('user:disconnected', room.users[this.id]);

		// push this game into the games array

		console.log("GAMESSSS", games);
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

	// delete game.players[this.id];

	console.log("BEFORE", game);

	if (game) {
		const personWhoLeft = game.players.find(
			(player) => player.id === this.id
		);
		delete game.players[personWhoLeft];
		io.to(game.room).emit("game:leave", personWhoLeft);
	}
	//remove matchmaking

	if (matchmaking.length > 0) {
		const playerIndex = matchmaking.findIndex(
			(player) => player.id === this.id
		);
		matchmaking.splice(playerIndex, 1);
	}

	console.log("AFTER", game);

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

	// handle hello
	socket.on("user:hello", handleHello);
};
