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
var Games = new Array(100);
var Rooms = new Array(100);
var countOfGames = 0;
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



io.on('connection', function (socket) {

	/**
	 * Request from client for creating game with bot.<br />
	 * Create one room with current user and fake 'Bot' user that won't be do any things.<br />
	 **/
	socket.on('startGameWithBot', function(data) {

		// Join the fake room that consist of one client.
		socket.join(countOfGames);

		// Save data in session.
		socket.userName = data.userName;
		socket.gameIndex = countOfGames;

		// Game settings.
		Rooms[countOfGames] = {};
		Rooms[countOfGames].id = countOfGames;
		Rooms[countOfGames].gameWithBot = true;
		Rooms[countOfGames].x1 = 100;
		Rooms[countOfGames].y1 = 300;
		Rooms[countOfGames].name1 = data.userName;
		Rooms[countOfGames].x2 = 1200;
		Rooms[countOfGames].y2 = 300;
		Rooms[countOfGames].name2 = 'Bot';

		// Make and initialize game.
		Games[countOfGames] = new Game();
		Games[countOfGames].setGame(Rooms[countOfGames], io);

		// Get all main objects and start game.
		io.in(countOfGames).emit('startGameWithBot', Games[countOfGames].getObjects());

		++countOfGames;
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
	 * If Rooms[i] is undefined then that rooms does not exist and it cannot be send to client.
	 * If Rooms[i] is defined but Rooms[i].name is undefined then that game represent
	 * game between player and 'Bot' and it cannot be send to client too.<br />
	 **/
	socket.on('getGames', function(data) {
		var allGames = [];
		for(var i = 0; i < Rooms.length; ++i) {
			if(undefined !== Rooms[i] && undefined !== Rooms[i].name) {
				allGames.push({
					name: Rooms[i].name,
					id: Rooms[i].id
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
		if(undefined !== Rooms[data.id].name2) {
			socket.emit('joinGameError', {
				text: 'Error: There are no empty place in game !'
			});
		} else {

			// Join the room.
			socket.join(Rooms[data.id].id);

			// Save 'gameIndex' in session.
			socket.gameIndex = Rooms[data.id].id;

			// Save 'userName' as the name of second player.
			Rooms[data.id].name2 = data.userName;

			socket.emit('joinGameSuccessful', Rooms[data.id]);
			socket.broadcast.to(Rooms[data.id].id).emit('userJoin', { name: data.userName });

			io.in(Rooms[data.id].id).emit('sendChatMessage', {
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

		// Join the room.
		socket.join(countOfGames);

		// Save 'gameIndex' in session.
		socket.gameIndex = countOfGames;

		// Game settings.
		Rooms[countOfGames] = {};
		Rooms[countOfGames].name = data.gameName;
		Rooms[countOfGames].id = countOfGames;
		Rooms[countOfGames].gameWithBot = false;
		Rooms[countOfGames].x1 = 100;
		Rooms[countOfGames].y1 = 300;
		Rooms[countOfGames].name1 = data.userName;
		Rooms[countOfGames].x2 = 1200;
		Rooms[countOfGames].y2 = 300;

		socket.emit('createGame', { gameIndex: countOfGames });
		
		socket.emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has joined the game...'
		});

		++countOfGames;
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

		socket.broadcast.to(Rooms[data.id].id).emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has left the game...'
		});

		io.in(Rooms[data.id].id).emit('userLeave', { name: data.userName });

		socket.leave(Rooms[data.id].id);

		// Delete 'gameIndex' from session.
		socket.gameIndex = undefined;

		if(undefined === Rooms[data.id].name2) {
			delete Rooms[data.id];
		} else {
			if(Rooms[data.id].name1 === data.userName) {
				Rooms[data.id].name1 = Rooms[data.id].name2;
				Rooms[data.id].start1 = Rooms[data.id].start2;
			}
			Rooms[data.id].name2 = undefined;
			Rooms[data.id].start2 = false;
		}
	});



	/**
	 * Request from client on start button pushing.<br />
	 * Rooms[data.id].start1 is defined the pushing start button by first player.<br />
	 * Rooms[data.id].start2 is defined the pushing start button by second player.<br />
	 **/
	socket.on('startButtonPushed', function(data) {

		io.in(Rooms[data.id].id).emit('sendChatMessage', {
			type: 'serverMessage',
			message: 'User ' + data.userName + ' has pushed the start button...'
		});

		if(Rooms[data.id].name1 === data.userName) {
			Rooms[data.id].start1 = true;
		} else {
			Rooms[data.id].start2 = true;
		}

		// If the first and second players pushed the start button then start the game.
		if(true === Rooms[data.id].start1 && true === Rooms[data.id].start2) {

			Games[Rooms[data.id].id] = new Game();
			Games[Rooms[data.id].id].setGame(Rooms[data.id], io);

			io.in(Rooms[data.id].id).emit('startGameWithUser', Games[Rooms[data.id].id].getObjects());

			Rooms[data.id].start1 = false;
			Rooms[data.id].start2 = false;
		}
	});



	/**
	 * Request from server on sending message in room's chat.<br />
	 **/
	socket.on('sendChatMessage', function(data) {
		io.in(Rooms[data.id].id).emit('sendChatMessage', {
			type: 'userMessage',
			time: getTimeInAMPM(new Date()),
			name: data.name,
			message: data.message
		});
	});


	socket.on('updatePlayerDirection', function(data) {
		Games[data.id].updatePlayerDirection(data);
	});


	/**
	 * Change player rotation and broadcast it other players.<br />
	 **/
	socket.on('changePlayerRotation', function(data) {
		Games[data.id].changePlayerRotation(data);
		io.in(data.id).emit('updatePlayersRotations', Games[data.id].getPlayersRotations());
	});



	/**
	 * Create player's bullet and broadcast it other players.<br />
	 **/
	socket.on('createBullet', function(data) {
		Games[data.id].createBullet(data);
		io.in(data.id).emit('updateBullets', Games[data.id].getBullets());
		io.in(data.id).emit('updatePlayersAmmunitions', Games[data.id].getPlayersAmmunitions());
	});



	/**
	* Don't change player's position if any collision is occured.<br />
	**/
	socket.on('stopPlayer', function(data) {
		Games[data.id].changePlayerPosition(data);
		io.in(data.id).emit('stopPlayer', data);
	});



	/**
	 * Change player's health if health power up was taken.<br />
	 **/
	socket.on('RestorePlayerHealth', function(data) {
		Games[data.id].restorePlayerHealth(data, io);
	});



	/**
	 * Change player's ammunition if ammunition power up was taken.<br />
	 **/
	socket.on('RestorePlayerAmmunition', function(data) {
		Games[data.id].restorePlayerAmmunition(data, io);
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

		io.in(socket.gameIndex).emit('userLeave', { name: socket.userName });

		socket.leave(socket.gameIndex);

		if(false === Rooms[socket.gameIndex].gameWithBot) {

			// If client was only user in the room then delete room at all.
			if(undefined === Rooms[socket.gameIndex].name2) {
				delete Rooms[socket.gameIndex];
			} else {

				// If in room was two users and disconnected user is the first then swap his with second user.
				if(Rooms[socket.gameIndex].name1 === socket.userName) {
					Rooms[socket.gameIndex].name1 = Rooms[socket.gameIndex].name2;
					Rooms[socket.gameIndex].start1 = Rooms[socket.gameIndex].start2;
				}

				Rooms[socket.gameIndex].name2 = undefined;
				Rooms[socket.gameIndex].start2 = false;
			}

		}

		if(undefined !== Games[socket.gameIndex]) {
			
			Games[socket.gameIndex].destroyPlayer(socket.userName, io);

			// If it was game with bot then delete fake room.
			if(true === Games[socket.gameIndex].gameWithBot) {
				delete Rooms[socket.gameIndex];
			}
			
		}

		// Delete 'gameIndex' from session.
		delete socket.gameIndex;

		// Delete 'userName' from session.
		delete socket.userName;
	});
});