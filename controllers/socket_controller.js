/**
 * Socket Controller
 */

const debug = require("debug")("battleship:socket_controller");
let io = null; // socket.io server instance

/**
 * Handle a user disconnecting
 *
 */
const handleDisconnect = function () {
	debug(`Client ${this.id} disconnected :(`);
};

/**
 * Handle a user sending a message
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
