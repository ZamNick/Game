//////////////////TEST
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Game = require('./server/game.js');

app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.use(express.static(__dirname + '/public'));

/**
 * Listening server port.<br />
 *
 * @type {Number}
 * @constant
 **/
var PORT = process.env.PORT || 8888;



server.listen(PORT);



// Entities
var Games = [];
var freeGames = [];
var nicknames = [];



/**
 * Convert time from milliseconds since 1970 year format into hh:mm AM(PM) format.<br />
 *
 * @see https://en.wikipedia.org/wiki/12-hour_clock
 * @param {Date} date
 * @return {String}
 **/
var getTimeInAMPM = function(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours %= 12;
	hours = hours ? hours : 12;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	return hours + ':' + minutes + ' ' + ampm;
}

function getGameIndex() {
	return freeGames.length > 0 ? freeGames.pop() : Games.length;
}



io.on('connection', function (socket) {

	/**
	 * Request from client for creating game with bot.<br />
	 * Create one room with current user and fake 'Bot' user that won't be do any things.<br />
	 **/
	socket.on('startGameWithBot', function(data) {

		var gameIndex = getGameIndex();

		// Join the fake room that consist of one client.
		socket.join(gameIndex);

		// Save data in session.
		socket.userName = data.userName;
		socket.gameIndex = gameIndex;

		Games[gameIndex] = new Game();

		Games[gameIndex].id = gameIndex;

		Games[gameIndex].gameWithBot = true;

		Games[gameIndex].addPlayerName(data.userName);
		socket.playerIndex = Games[gameIndex].addPlayer(data.userName);

		Games[gameIndex].addPlayerName('Bot');
		Games[gameIndex].addPlayer('Bot');

		Games[gameIndex].setGame(io);

		socket.emit('savePlayerIndex', { playerIndex: socket.playerIndex });

		socket.emit('startGameWithBot', Games[gameIndex].getObjects());
	});



	/**
	 * Request from client on check if anyone is already using client name.<br />
	 **/
	socket.on('checkUserName', function(data) {

		// Check if 'userName' already exists in nicknames array.
		var isUsed = nicknames.indexOf(data.userName) === -1 ? false : true;

		if(false === isUsed) {

			// Save 'userName' in array of nicknames.
			nicknames.push(data.userName);

			// Save 'userName' in session.
			socket.userName = data.userName;
		}

		// Send response to client.
		socket.emit('checkUserName', { isUsed: isUsed, userName: data.userName });
	});



	/**
	 * Request from client on delete 'userName' from nicknames array.<br />
	 **/
	socket.on('deleteUserName', function(data) {
		nicknames.splice(nicknames.indexOf(data.userName), 1);
	});



	/**
	 * Request from client on send all available games to client.<br />
	 * If Games[i] is undefined then that rooms does not exist and it cannot be send to client.
	 * If Games[i] is defined but Games[i].name is undefined then that game represent
	 * game between player and 'Bot' and it cannot be send to client too.<br />
	 **/
	socket.on('getGames', function(data) {
		var allGames = [];
		for(var i = 0; i < Games.length; ++i) {
			if(undefined !== Games[i] && true !== Games[i].gameWithBot) {
				allGames.push({
					name: Games[i].name,
					id: Games[i].id
				});
			}
		}
		socket.emit('getGames', allGames);
	});



	/**
	 * Request from client on join game.<br />
	 * If second place of the room is not empty then generate error and send it to client.
	 * Otherwise, join current client to the room, send other users from room information
	 * about new player and send all room information to new player.<br />
	 **/
	socket.on('joinGame', function(data) {
		if(undefined === Games[data.id]) {
			socket.emit('joinGameError', {
				text: 'Error: This game does not exist !'
			});
		} else {

			// Join the game.
			socket.join(data.id);

			// Save 'gameIndex' in session.
			socket.gameIndex = data.id;

			// Save user name in game.
			Games[data.id].addPlayerName(data.userName);

			socket.emit('joinGameSuccessful', { });

			io.in(data.id).emit('updateMembersList', { playersNames: Games[data.id].getPlayersNames() });			

			io.in(data.id).emit('sendChatMessage', {
				type: 'serverMessage',
				message: 'User ' + data.userName + ' has joined the game...' 
			});
		}
	});



	/**
	 * Request from client on game creating.<br />
	 * Create game and send 'id' of the current game to client.<br />
	 * Send 'create game' message for yourself to be sure that you has joined the room. </br>
	 **/
	socket.on('createGame', function(data) {

		var gameIndex = getGameIndex();

		// Join the room.
		socket.join(gameIndex);

		// Save 'gameIndex' in session.
		socket.gameIndex = gameIndex;

		Games[gameIndex] = new Game();

		Games[gameIndex].id = gameIndex;

		Games[gameIndex].name = data.gameName;

		Games[gameIndex].gameWithBot = false;

		Games[gameIndex].addPlayerName(data.userName);

		socket.emit('createGame', { gameIndex: gameIndex });
		
		socket.emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has joined the game...'
		});
	});



	/**
	 * Request from client on leaving game by user.<br />
	 * Broadcast to others that client has left the room.<br />
	 * If it was the last client in the room then delete room at all.<br />
	 * Otherwise, if the creator has left the room then make another 
	 * player as a creator (switching his name with name of the first client)
	 * and delete the second client from room.<br />
	 **/
	socket.on('leaveGame', function(data) {

		Games[data.id].deletePlayerName(data.userName);

		if(true === data.startButtonPushed) {
			--Games[data.id].buttonsPushed;
		}

		Games[socket.gameIndex].deletePlayer(socket.playerIndex);

		socket.broadcast.to(data.id).emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has left the game...'
		});

		socket.broadcast.to(data.id).emit('updateMembersList', { playersNames: Games[data.id].getPlayersNames() });

		socket.leave(data.id);

		// Delete 'gameIndex' from session.
		delete socket.gameIndex;

		// Delete 'playerIndex' from session.
		delete socket.playerIndex;

		// If game is empty then delete it.
		if(0 === Games[data.id].getPlayersNames().length) {
			delete Games[data.id];
			freeGames.push(data.id);
		}
	});



	/**
	 * Request from client on start button pushing.<br />
	 * Rooms[data.id].start1 is defined the pushing start button by first player.<br />
	 * Rooms[data.id].start2 is defined the pushing start button by second player.<br />
	 **/
	socket.on('startButtonPushed', function(data) {

		io.in(data.id).emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has pushed the start button...'
		});

		++Games[data.id].buttonsPushed;

		socket.playerIndex = Games[data.id].addPlayer(data.userName);

		socket.emit('savePlayerIndex', { playerIndex: socket.playerIndex });

		if(Games[data.id].buttonsPushed === Games[data.id].getPlayersNames().length) {

			Games[data.id].setGame(io);

			io.in(data.id).emit('startGameWithUser', Games[data.id].getObjects());

			Games[data.id].buttonsPushed = 0;
		}
	});



	/**
	 * Request from server on sending message in room's chat.<br />
	 **/
	socket.on('sendChatMessage', function(data) {
		io.in(data.id).emit('sendChatMessage', {
			type: 'userMessage',
			time: getTimeInAMPM(new Date()),
			name: data.name,
			message: data.message
		});
	});



	socket.on('updatePlayerDirection', function(data) {
		Games[data.id].updatePlayerDirection(socket.playerIndex, data);
	});



	/**
	 * Change player rotation and broadcast it other players.<br />
	 **/
	socket.on('changePlayerRotation', function(data) {
		Games[data.id].changePlayerRotation(socket.playerIndex, data);
	});



	/**
	 * Create player's bullet and broadcast it other players.<br />
	 **/
	socket.on('createBullet', function(data) {
		Games[data.id].createBullet(socket.playerIndex, data);
	});



	/**
	 * Change player's health if health power up was taken.<br />
	 **/
	socket.on('RestorePlayerHealth', function(data) {
		Games[data.id].restorePlayerAttribute(socket.playerIndex, data, io);
	});



	/**
	 * Change player's ammunition if ammunition power up was taken.<br />
	 **/
	socket.on('RestorePlayerAmmunition', function(data) {
		Games[data.id].restorePlayerAttribute(socket.playerIndex, data, io);
	});
	


	/**
	 * Behavior for disconnect.<br />
	 **/
	socket.on('disconnect', function() {

		// Delete 'userName' from nicknames array if it exists.
		if(-1 !== nicknames.indexOf(socket.userName)) {
			nicknames.splice(nicknames.indexOf(socket.userName), 1);
		}

		if(undefined === socket.gameIndex) return;

		socket.broadcast.to(socket.gameIndex).emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + socket.userName + ' has disconnected...'
		});

		if(undefined !== Games[socket.gameIndex]) {
			
			Games[socket.gameIndex].deletePlayerName(socket.userName);

			socket.broadcast.to(socket.gameIndex).emit('updateMembersList', { playersNames: Games[socket.gameIndex].getPlayersNames() });

			socket.leave(socket.gameIndex);

			if(Games[socket.gameIndex].countOfPlayers() > 0) {
				Games[socket.gameIndex].destroyPlayer(socket.playerIndex, io);
				Games[socket.gameIndex].deletePlayer(socket.playerIndex);
			}

			// If it was game with bot then delete fake room.
			if(0 === Games[socket.gameIndex].getPlayersNames().length || true === Games[socket.gameIndex].gameWithBot) {
				delete Games[socket.gameIndex];
				freeGames.push(socket.gameIndex);
			}
		}

		// Delete 'playerIndex' from session.
		delete socket.playerIndex;

		// Delete 'gameIndex' from session.
		delete socket.gameIndex;

		// Delete 'userName' from session.
		delete socket.userName;
	});
});