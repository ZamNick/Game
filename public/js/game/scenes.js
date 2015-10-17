/**
 * Scene is a way to organize a game. A scene is defined by a name and a setup
 * function called when the scene starts. Scene contain all 2D objects - actors - that can be created.
 * All moving that occurs with someone actor immediately showing on the screen.<br />
 *
 * @see http://craftyjs.com/api/Crafty-scene.html
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/



Crafty.scene('Game', function(data) {

	var players = [];
	var bullets = [];
	var powerUps = [];

	var socket = data.socket;
	var playerIndex = data.socket.playerIndex;

	for(var x = 0; x < 20; ++x) {
		for(var y = 0; y < 20; ++y) {
			Crafty.e('BackgroundBlock').__init( x * 222, y * 204, data.ground);
		}
	}

	var bulletsPull = new BulletsPull();

	for(var i = 1; i < data.blocks.length; ++i) {
		Crafty.e('Block').__init(data.blocks[i].x, data.blocks[i].y);
	}

	for(var i = 0; i < data.players.length; ++i) {
		if(null !== data.players[i]) {
			if(i === playerIndex) {
				players[i] = Crafty.e('Player').__init(data.players[i].x, data.players[i].y, data.players[i].name, data.id, socket);

				// Event handlers
				Crafty.addEvent(players[i], Crafty.stage.elem, 'mousedown', players[i].onMouseDown);
				Crafty.addEvent(players[i], Crafty.stage.elem, 'mousemove', players[i].onMouseMove);
				Crafty.addEvent(players[i], Crafty.stage.elem, 'mouseup', players[i].onMouseUp);

			} else {
				players[i] = Crafty.e('Player').__init(data.players[i].x, data.players[i].y, data.players[i].name);
			}
		}
	}

	Crafty.viewport.bounds = {min:{x: 0, y: 0}, max:{x: data.blocks[0].x, y: data.blocks[0].y}}; //map size
	Crafty.viewport.follow(players[playerIndex], 0, 0);

	socket.on('updatePlayers', function(data) {
		for(var i = 0; i < data.players.length; ++i) {

			if(null === data.players[i]) continue;

			if(data.players[i].health < players[i].health) {
				players[i].trigger('Hurt');
			}

			players[i].attr({
				x: data.players[i].x,
				y: data.players[i].y,
				rotation: data.players[i].rotation,
				ammunition: data.players[i].ammunition,
				health: data.players[i].health
			});

			players[i].trigger('changeRobotNamePosition');
			players[i].trigger('changeHealthBarPosition');
			players[i].trigger('changeAmmunitionBarPosition');
			players[i].trigger('changeAmmunitionBarValue');

			if(players[i].health <= 0) {
				players[i].trigger('Die');
			} else {
				players[i].trigger('changeHealthBarValue');
			}
		}
	});


	socket.on('updateBullets', function(data) {
		for(var i = 0; i < data.bullets.length; ++i) {
			if(data.bullets[i] === null && bullets[i] !== undefined) {
				bulletsPull.returnBullet(bullets[i]);
				bullets[i] = undefined;
			} else if(data.bullets[i] !== null) {
				if(undefined === bullets[i]) {
					bullets[i] = bulletsPull.getBullet(data.bullets[i].type);
				}
				bullets[i].attr({
					x: data.bullets[i].x,
					y: data.bullets[i].y,
					rotation: data.bullets[i].rotation
				});
			}
		}
	});


	socket.on('createPowerUp', function(data) {
		powerUps[data.id] = Crafty.e(data.type).attr({ id: data.id, x: data.x, y: data.y });
	});


	socket.on('destroyPowerUp', function(data) {
		if(powerUps[data.powerUpId]) {
			powerUps[data.powerUpId].destroy();
		}
		delete powerUps[data.powerUpId];
	});


	socket.on('endGame', function(data) {

		if(playerIndex !== data.playerIndex) return;

		Crafty('2D').destroy();

		document.getElementById('cr-stage').style.display = 'none';

		var button = document.getElementById('end-game-menu-return-back-button');

		if(true === data.gameWithBot) {
			button.innerHTML = 'Return to menu';
		} else {
			button.innerHTML = 'Return to room';
		}

		document.getElementById('end-game-menu').style.display = 'block';
		
		if(players[data.playerIndex].health <= 0) document.getElementById('end-game-menu-result').innerHTML = 'You lose !';
		else document.getElementById('end-game-menu-result').innerHTML = 'You win !';

		socket.removeAllListeners('updatePlayers');
		socket.removeAllListeners('updateBullets');
		socket.removeAllListeners('createPowerUp');
		socket.removeAllListeners('destroyPowerUp');
		socket.removeAllListeners('endGame');

		socket.emit('removePlayerIndex', { });

		delete playerIndex;
	});
});