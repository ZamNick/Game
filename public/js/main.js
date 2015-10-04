/**
 * This file represent main logic of UI part of the game.<br />
 *
 * When the web-site of game is loading all event handlers are loading and bounding with corresponding elements,
 * starting listening all response from server, cashing all main elements for increase the execution of application.<br />
 *
 * File starting to executes when all HTML and CSS content already loaded for make sure that all elements already on page.<br />
 * 
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 **/
window.onload = function() {

	// Try connect to server.
	var socket = io.connect('http://localhost:8888');

	// Cashing all main elements.
	var startMenu = document.getElementById('start-menu');
	var startMenuInput = document.getElementById('start-menu-input');
	var startMenuError = document.getElementById('start-menu-error');
	var startMenuStartGameWithBotButton = document.getElementById('start-menu-start-game-with-bot-button');
	var startMenuStartGameWithUserButton = document.getElementById('start-menu-start-game-with-user-button');
	var playWithUserMenu = document.getElementById('play-with-user-menu');
	var playWithUserMenuError = document.getElementById('play-with-user-menu-error');
	var playWithUserMenuAvailableGames = document.getElementById('play-with-user-menu-available-games');
	var playWithUserMenuScroll = document.getElementById('play-with-user-menu-scroll');
	var playWithUserMenuJoinButton = document.getElementById('play-with-user-menu-join-button');
	var playWithUserMenuCreateGameButton = document.getElementById('play-with-user-menu-create-game-button');
	var playWithUserMenuReturnBackButton = document.getElementById('play-with-user-menu-return-back-button');
	var createGameMenu = document.getElementById('create-game-menu');
	var createGameMenuInput = document.getElementById('create-game-menu-input');
	var createGameMenuError = document.getElementById('create-game-menu-error');
	var createGameMenuCreateGameButton = document.getElementById('create-game-menu-create-game-button');
	var createGameMenuReturnBackButton = document.getElementById('create-game-menu-return-back-button');
	var roomMenu = document.getElementById('room-menu');
	var roomMenuMembers = document.getElementById('room-menu-members');
	var roomMenuStartGameButton = document.getElementById('room-menu-start-game-button');
	var roomMenuReturnBackButton = document.getElementById('room-menu-return-back-button');
	var roomMenuTextArea = document.getElementById('room-menu-text-area');
	var endGameMenu = document.getElementById('end-game-menu');
	var endGameMenuReturnBackButton = document.getElementById('end-game-menu-return-back-button');

	// Store all available games on client.
	var games = [];

	// Store 'id' of 'setInterval' of getting all available games from server. Needed to 'clearInterval' only.
	var getGamesFromServerId = 0;

	var chat = new Chat(socket);
	
	var playWithUserMenuAvailableGamesScroll = new Scroll(playWithUserMenuScroll, playWithUserMenuAvailableGames, 300);

	// Add 'Wheel' event on the available games scroll.
    WheelEventListener.addHandler(playWithUserMenuAvailableGames, playWithUserMenuAvailableGamesScroll.onWheel);

	// Add 'click' event for all buttons.
	startMenuStartGameWithBotButton.addEventListener('click', startGameWithBotHandler, false);
	startMenuStartGameWithUserButton.addEventListener('click', startGameWithUserHandler, false);
	playWithUserMenuJoinButton.addEventListener('click', playWithUserMenuJoinButtonHandler, false);
	playWithUserMenuCreateGameButton.addEventListener('click', playWithUserMenuCreateGameButtonHandler, false);
	playWithUserMenuReturnBackButton.addEventListener('click', playWithUserMenuReturnBackButtonHandler, false);
	createGameMenuCreateGameButton.addEventListener('click', createGameMenuCreateGameButtonHandler, false);
	createGameMenuReturnBackButton.addEventListener('click', createGameMenuReturnBackButtonHandler, false);
	roomMenuStartGameButton.addEventListener('click', roomMenuStartGameButtonHandler, false);
	roomMenuReturnBackButton.addEventListener('click', roomMenuReturnBackButtonHandler, false);
	endGameMenuReturnBackButton.addEventListener('click', endGameMenuReturnBackButtonHandler, false);



	/**
	 * 'Start' menu.<br />
	 *
	 * Handler start working whenever 'Play with Bot' button will pushed.<br />
	 *
	 * @function
	 * @event startGameWithBotButton#Click
	 * @return {void}
	 **/
	function startGameWithBotHandler() {

		// Get user name.
		var userName = startMenuInput.value;

		// Send 'userName' on server for game with bot creating.
		socket.emit('startGameWithBot', { userName : userName });
	}



	/**
	 * 'Start' menu.<br />
	 *
	 * Handler start working whenever 'Play with User' button will pushed.<br />
	 *
	 * @function
	 * @event startGameWithUserButton#Click
	 * @return {void}
	 **/
	function startGameWithUserHandler() {

		// Get user name.
		var userName = startMenuInput.value;

		// Check if 'userName' is not empty.
		if('' === userName) {
			startMenuError.innerHTML = "Error: Name cannot be empty !";
			return;
		}

		// Send 'userName' on server and check if anyone is already using this name.
		socket.emit('checkUserName', { userName: userName });
	}



	/**
	 * 'Play with User' menu.<br />
	 *
	 * Handler start working whenever 'Create game' button will pushed.<br />
	 *
	 * @function
	 * @event playWithUserMenuCreateGameButton#Click
	 * @return {void}
	 **/
	function playWithUserMenuCreateGameButtonHandler() {

		// Show 'create game' menu.
		playWithUserMenu.style.display = 'none';
		createGameMenu.style.display = 'block';

		// Clear 'play with user' menu error message box.
		playWithUserMenuError.innerHTML = '';

		// Break generate requests for server for update available games list.
		clearInterval(getGamesFromServerId);
	}



	/**
	 * 'Play with User' menu.<br />
	 *
	 * Handler start working whenever 'Return Back' button will pushed.<br />
	 *
	 * @function
	 * @event playWithUserMenuReturnBackButton#Click
	 * @return {void}
	 **/
	function playWithUserMenuReturnBackButtonHandler() {

		// Show 'start' menu.
		playWithUserMenu.style.display = 'none';
		startMenu.style.display = 'block';

		// Clear 'play with user' menu error message box.
		playWithUserMenuError.innerHTML = '';

		// If someone marker has already been selected then unselect it.
		if(undefined !== socket.gameIndex && undefined !== games[socket.gameIndex]) {
			games[socket.gameIndex].style.background = 'black';
			games[socket.gameIndex].style.color = 'rgb(249, 38, 114)';
		}

		// Clear 'gameIndex' in session.
		socket.gameIndex = undefined;

		// Break generate requests for server for update available games list.
		clearInterval(getGamesFromServerId);

		// Delete 'userName' from server.
		socket.emit('deleteUserName', { userName: socket.userName });
	}



	/**
	 * 'Play with User' menu.<br />
	 *
	 * Handler start working whenever 'Join Game' button will pushed.<br />
	 *
	 * Send request to server for joining game.<br />
	 * 'socket.gameIndex' in this time store the position of current game in 'games' array.<br />
	 * If 'socket.gameIndex' is not defined then show corresponding message in error box.<br />
	 *
	 * @function
	 * @event playWithUserMenuJoinButton#Click
	 * @return {void}
	 **/
	function playWithUserMenuJoinButtonHandler() {
		
		if(undefined !== socket.gameIndex && undefined !== games[socket.gameIndex]) {
			socket.emit('joinGame', {
				id: socket.gameIndex,
				userName: socket.userName
			});
		} else {
			playWithUserMenuError.innerHTML = "Error: You do not choose any game !";
		}
	}



	/**
	 * 'Create game' menu.<br />
	 *
	 * Handler start working whenever 'Create game' button will pushed.<br />
	 *
	 * @function
	 * @event createGameMenuCreateGameButton#Click
	 * @return {void}
	 **/
	function createGameMenuCreateGameButtonHandler() {

		// Get game name.
		var gameName = createGameMenuInput.value;

		// Check if 'gameName' is not empty.
		if('' === gameName) {
			createGameMenuError.innerHTML = "Error: Name cannot be empty !";
			return;
		}

		// Send data to server for game creating.
		socket.emit('createGame', {
			gameName: gameName,
			userName: socket.userName
		});
	}



	/**
	 * 'Create game' menu.<br />
	 *
	 * Handler start working whenever 'Return back' button will pushed.<br />
	 *
	 * @function
	 * @event createGameMenuReturnBackButton#Click
	 * @return {void}
	 **/
	function createGameMenuReturnBackButtonHandler() {

		// Clear 'create game' menu error message box.
		createGameMenuError.innerHTML = '';

		// Show 'play with user' menu.
		createGameMenu.style.display = 'none';
		playWithUserMenu.style.display = 'block';

		// Get all available games from server.
		getGamesFromServerId = setInterval(function() { getGamesFromServer() }, 1000);
	}



	/**
	 * Send request 'getGames' to server for getting all available games.<br />
	 *
	 * @function
	 * @return {void}
	 **/
	function getGamesFromServer() {

		socket.emit('getGames', { });
	}



	/**
	 * 'Play with User' menu.<br />
	 *
	 * Handler start working whenever anyone 'li' element is active by mouse clicking.<br />
	 *
	 * 'socket.gameIndex' is defining when user click on someone marker in the list of available games.<br />
	 * In the start, when any marker is not selected, 'socket.gameIndex' equals 'undefined'.<br />
	 * If 'socket.gameIndex' is not undefined then someone marker already been selected. In this case,
	 * unselect previous marker and take current marker.<br />
	 *
	 * @function
	 * @event liButton#Click
	 * @return {void}
	 **/
	function liButtonClickHandler() {
		
		if(undefined !== socket.gameIndex && undefined !== games[socket.gameIndex]) {

			// Change the previous marker style.
			games[socket.gameIndex].style.background = 'black';
			games[socket.gameIndex].style.color = 'rgb(249, 38, 114)';
		}

		// Save 'clientGameIndex' in session.
		socket.gameIndex = this.getAttribute('gameIndex');

		// Change the current marker style.
		this.style.background = 'rgb(249, 38, 114)';
		this.style.color = 'black';
	}



	/**
	 * 'Room' menu.<br />
	 *
	 * Handler start working whenever 'Start game' button will pushed.<br />
	 *
	 * @function
	 * @event roomMenuStartGameButton#Click
	 * @return {void}
	 **/
	function roomMenuStartGameButtonHandler() {

		// Send message to server about start game button pushing by user.
		socket.emit('startButtonPushed', {
			id: socket.gameIndex,
			userName: socket.userName
		});

		// Disable the start button.
		roomMenuStartGameButton.style.visibility = 'hidden';
	}



	/**
	 * 'Room' menu.<br />
	 *
	 * Handler start working whenever 'Return back' button will pushed.<br />
	 *
	 * @function
	 * @event roomMenuReturnBackButton#Click
	 * @return {void}
	 **/
	function roomMenuReturnBackButtonHandler() {

		// Show 'play with user' menu.
		roomMenu.style.display = 'none';
		playWithUserMenu.style.display = 'block';

		// Clear the 'chat' and reset 'chat' style.
		roomMenuTextArea.innerHTML = '';
		roomMenuTextArea.style.top = '0px';

		// Send request to server for leaving game.
		socket.emit('leaveGame', {
			id: socket.gameIndex,
			userName: socket.userName,
			startButtonPushed: ('hidden' === roomMenuStartGameButton.style.visibility)
		});

		// If the start button was hidden then show it again.
		roomMenuStartGameButton.style.visibility = 'visible';

		// Reset scroll style.
		chat.resetScroll();

		// Clear members list.
		roomMenuMembers.innerHTML = '';

		// Delete 'gameIndex' from session.
		// delete socket.gameIndex;

		// Delete 'playerIndex' from session.
		delete socket.playerIndex;

		// Get all available games.
		getGamesFromServerId = setInterval(function() { getGamesFromServer() }, 1000);
	}



	/**
	 * 'End Game' menu.<br />
	 *
	 * Handler start working whenever 'Return back' button will pushed.<br />
	 *
	 * @function
	 * @event endGameMenuReturnBackButton#Click
	 * @return {void}
	 **/
	function endGameMenuReturnBackButtonHandler() {

		// Hide 'end game' menu.
		endGameMenu.style.display = 'none';

		// Check on game with bot.
		// If 'socket.gameWithBot' is defined then game was game with bot.
		// Otherwise, it wasn't.
		if(undefined === socket.gameWithBot) {

			// Show 'room' menu.
			roomMenu.style.display = 'block';
			roomMenuStartGameButton.style.visibility = 'visible';

			// Update chat scroll.
			chat.updateScroll();
		} else {

			// Show 'start' menu.
			startMenu.style.display = 'block';

			// Send request for server for delete fake 'one-user' room.
			socket.emit('leaveGame', { id: socket.gameIndex, userName: socket.userName });

			// Reset 'gameWithBot' flag.
			socket.gameWithBot = undefined;
		}
	}



	/**
	 * Response from server for starting game with bot.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('startGameWithBot', function(data) {
		
		// Save game id in session.
		socket.gameIndex = data.id;

		// Mark that game as game with bot.
		socket.gameWithBot = true;

		// Save socket in game object.
		data.socket = socket;

		// Hide 'start' menu.
		startMenu.style.display = 'none';

		// Let's start.
		Game.start(data);
	});



	/**
	 * Response from server for check user name existance.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('checkUserName', function(data) {
		if(true === data.isUsed) {
			startMenuError.innerHTML = "Error: This name is already used !";
		} else {

			// Clear the start menu error message box.
			startMenuError.innerHTML = '';

			// Show play with user menu.
			startMenu.style.display = 'none';
			playWithUserMenu.style.display = 'block';

			// Save name in session.
			socket.userName = data.userName;

			// Get all available games from server.
			getGamesFromServerId = setInterval(function() { getGamesFromServer() }, 1000);
		}
	});



	/**
	 * Response from server for join game.<br />
	 *
	 * If error was occured then show the corresponding message.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('joinGameError', function(data) {
		playWithUserMenuError.innerHTML = data.text;
	});



	/**
	 * Response from server for join game.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('joinGameSuccessful', function() {

		// Override the session 'gameIndex'.
		// Since 'socket.gameIndex' will contain 'id' of current game on server-side.
		// socket.gameIndex = games[socket.gameIndex].getAttribute('serverGameIndex');

		// Show 'room' menu.
		playWithUserMenu.style.display = 'none';
		roomMenu.style.display = 'block';

		// Clear 'play with user' menu error message box.
		playWithUserMenuError.innerHTML = '';

		// Break generate requests for server for update available games list.
		clearInterval(getGamesFromServerId);
	});



	socket.on('updateMembersList', function(data) {

		// Clear 'room' menu members list.
		roomMenuMembers.innerHTML = '';

		for(var i = 0; i < data.playersNames.length; ++i) {

			// Create marker for someone player.
			var li = document.createElement('li');

			// Add his name in his own marker.
			li.innerHTML = data.playersNames[i];

			// Add his marker to the room menu members list.
			roomMenuMembers.appendChild(li);
		}
	});



	socket.on('savePlayerIndex', function(data) {

		// Save 'playerIndex' in session.
		socket.playerIndex = data.playerIndex;

	});



	/**
	 * Response from server for creating game.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('createGame', function(data) {

		// Save 'gameIndex' in session.
		// Since 'socket.gameIndex' will contain 'id' of current game on server-side.
		socket.gameIndex = data.gameIndex;

		// Show 'room' menu.
		createGameMenu.style.display = 'none';
		roomMenu.style.display = 'block';

		// Create marker for yourself.
		var li = document.createElement('li');
		li.innerHTML = socket.userName;

		// Add yourself to the room menu members list.
		roomMenuMembers.appendChild(li);
	});



	/**
	 * Response from server for get all available games from server.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('getGames', function(data) {

		// Clear the array of stored games.
		games = [];

		// Clear the available games list.
		playWithUserMenuAvailableGames.innerHTML = '';

		// Reset the available games scroll.
		playWithUserMenuAvailableGamesScroll.reset();

		// Create the list of games.
		for(var i = 0; i < data.length; ++i) {

			// For every available game create your own marker.
			var li = document.createElement('li');

			// Add event handler to the marker.
			li.addEventListener('click', liButtonClickHandler, false);

			// Add 'clientGameIndex' attribute that contain position of current game in 'games'.
			// li.setAttribute('clientGameIndex', i);

			// Add 'serverGameIndex' attribute that contain 'id' of current game on server-side.
			li.setAttribute('gameIndex', data[i].id);

			// Add CSS class.
			li.setAttribute('class', 'play-with-user-menu-li');

			// Add name of available game.
			li.innerHTML = data[i].name;

			// Add marker to available games list.
			playWithUserMenuAvailableGames.appendChild(li);

			// Add marker in array that store all games.
			games[data[i].id] = li;
		}

		// If someone marker has already been selected and corresponding game is defined then let it be selected.
		if(undefined !== socket.gameIndex && undefined !== games[socket.gameIndex]) {
			games[socket.gameIndex].style.background = 'rgb(249, 38, 114)';
			games[socket.gameIndex].style.color = 'black';
		}

		// Update available games scroll.
		playWithUserMenuAvailableGamesScroll.update();
	});



	/**
	 * Response from server for start game.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('startGameWithUser', function(data) {

		// Save 'socket' in game object.
		data.socket = socket;

		// Hide 'room' menu.
		roomMenu.style.display = 'none';

		// Go play.
		Game.start(data);
	});
}