/**
 * Scene is a way to organize a game. A scene is defined by a name and a setup
 * function called when the scene starts. Scene contain all 2D objects - actors - that can be created.
 * All moving that occurs with someone actor immediately showing on the screen.<br />
 *
 * @see http://craftyjs.com/api/Crafty-scene.html
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 **/



Crafty.scene('Game', function(data) {

	for(var i = 0; i < data.blocks.length; ++i) {
		Crafty.e('Block').__init(data.blocks[i].x, data.blocks[i].y);
	}

	// Entities
	var player1 = Crafty.e('Player').__init(data.player1.x, data.player1.y, data.player1.name, data.id, data.socket);
	var player2 = Crafty.e('Player').__init(data.player2.x, data.player2.y, data.player2.name);

	var bullets = [];
	var powerUps = [];

	var socket = data.socket;


	// Event handlers
	Crafty.addEvent(player1, Crafty.stage.elem, 'mousedown', player1.onMouseDown);
	Crafty.addEvent(player1, Crafty.stage.elem, 'mousemove', player1.onMouseMove);
	Crafty.addEvent(player1, Crafty.stage.elem, 'mouseup', player1.onMouseUp);


	socket.on('updatePlayersPositions', function(data) {
		if(data.name1 === player1.name) {
			player1.attr({
				x: data.x1,
				y: data.y1
			});
			player2.attr({
				x: data.x2,
				y: data.y2
			});
		} else {
			player1.attr({
				x: data.x2,
				y: data.y2
			});
			player2.attr({
				x: data.x1,
				y: data.y1
			});
		}

		player1.trigger('changeRobotNamePosition');
		player1.trigger('changeHealthBarPosition');
		player1.trigger('changeAmmunitionBarPosition');

		player2.trigger('changeRobotNamePosition');
		player2.trigger('changeHealthBarPosition');
		player2.trigger('changeAmmunitionBarPosition');
	});


	socket.on('updatePlayersRotations', function(data) {
		if(data.name1 === player1.name) {
			player1.rotation = data.rotation1;
			player2.rotation = data.rotation2;
		} else {
			player1.rotation = data.rotation2;
			player2.rotation = data.rotation1;
		}
	});


	socket.on('updatePlayersAmmunitions', function(data) {
		if(data.name1 === player1.name) {
			player1.ammunition = data.ammunition1;
			player2.ammunition = data.ammunition2;
		} else {
			player1.ammunition = data.ammunition2;
			player2.ammunition = data.ammunition1;
		}

		player1.trigger('changeAmmunitionBarValue');
		player2.trigger('changeAmmunitionBarValue');
	});


	socket.on('updateBullets', function(data) {
		for(var i = 0; i < data.bullets.length; ++i) {
			if(data.bullets[i] === null && bullets[i] !== undefined) {
				bullets[i].destroy();
				delete bullets[i];
			} else if(bullets[i] === undefined && data.bullets[i] !== null) {
				if(data.bullets[i].owner === player1.name) {
					bullets[i] = Crafty.e(player1.weapon.name);
				} else {
					bullets[i] = Crafty.e(player2.weapon.name);
				}
				bullets[i].attr({
					x: data.bullets[i].x,
					y: data.bullets[i].y,
					rotation: data.bullets[i].rotation
				});
			} else if(bullets[i] !== undefined && data.bullets[i] !== null) {
				bullets[i].attr({
					x: data.bullets[i].x,
					y: data.bullets[i].y,
					rotation: data.bullets[i].rotation
				});
			}
		}
	});


	socket.on('updatePlayerHealth', function(data) {
		if(data.name1 === player1.name) {
			if(data.health < player1.health) {
				player1.trigger('Hurt');
			}
			player1.health = data.health;
			if(player1.health <= 0) {
				player1.trigger('Die');
			} else {
				player1.trigger('changeHealthBarValue');
			}
		} else {
			if(data.health < player2.health) {
				player2.trigger('Hurt');
			}
			player2.health = data.health;
			if(player2.health <= 0) {
				player2.trigger('Die');
			} else {
				player2.trigger('changeHealthBarValue');
			}
		}
	});


	socket.on('updatePlayerAmmunition', function(data) {
		if(data.name1 === player1.name) {
			player1.ammunition = data.ammunition;
			player1.trigger('changeAmmunitionBarValue');
		} else {
			player2.ammunition = data.ammunition;
			player2.trigger('changeAmmunitionBarValue');
		}
	});


	socket.on('stopPlayer', function(data) {
		if(data.name === player1.name) {
			player1.x = data.x;
			player1.y = data.y;
			player1._speed = 0;
		} else {
			player2.x = data.x;
			player2.y = data.y;
			player2._speed = 0;
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

		Crafty('2D').destroy();

		document.getElementById('cr-stage').style.display = 'none';

		var button = document.getElementById('end-game-menu-return-back-button');

		if(true === data.gameWithBot) {
			button.innerHTML = 'Return to menu';
		} else {
			button.innerHTML = 'Return to room';
		}

		document.getElementById('end-game-menu').style.display = 'block';
		
		if(player1.health <= 0) document.getElementById('end-game-menu-result').innerHTML = 'You lose !';
		else document.getElementById('end-game-menu-result').innerHTML = 'You win !';

		socket.removeAllListeners('updatePlayersPositions');
		socket.removeAllListeners('updatePlayersRotations');
		socket.removeAllListeners('updatePlayersAmmunitions');
		socket.removeAllListeners('updateBullets');
		socket.removeAllListeners('updatePlayerHealth');
		socket.removeAllListeners('updatePlayerAmmunition');
		socket.removeAllListeners('stopPlayer');
		socket.removeAllListeners('createPowerUp');
		socket.removeAllListeners('destroyPowerUp');
		socket.removeAllListeners('endGame');
	});
});