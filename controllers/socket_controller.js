/**
 * Socket Controller
 */

const debug = require("debug")("battleship:socket_controller");
let io = null; // socket.io server instance

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

/**
 * Handle a user disconnecting
 *
 */
const handleDisconnect = function () {
	debug(`Client ${this.id} disconnected :(`);
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

	debug(`Client ${socket.id} connected`);

	// handle user disconnect
	socket.on("disconnect", handleDisconnect);

	// handle hello
	socket.on("user:hello", handleHello);
};
