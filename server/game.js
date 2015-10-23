var Player = require('./player.js');
var Bullet = require('./bullet.js');
var PowerUp = require('./powerup.js');
var Block = require('./block.js');
var Maps = require('./maps.js');

var Game = function() {

	this.id = 0;

	this.name = '';

	this.width = 0;
	this.height = 0;

	this.gameWithBot = false;

	this.buttonsPushed = 0;

	this.playersNames = [];

	this.players = [];
	this.freePlayers = [];

	this.blocks = [];

	this.bullets = [];
	this.destroyedBullets = [];

	this.powerUps = [];
	this.destroyedPowerUps = [];

	this.updateBulletsId = 0;
	this.generatePowerUpsId = 0;
	this.updatePlayersId = 0;

	this.setGame = function(io) {

		this.updateBulletsId = this.updateBullets(io);
		this.generatePowerUpsId = this.generatePowerUps(io);
		this.updatePlayersId = this.updatePlayers(io);

		this.width = Maps[0].x[0];
		this.height = Maps[0].y[0];

		this.blocks = [];

		for(var i = 1; i < Maps[0].x.length; ++i) {
			this.blocks.push(new Block(Maps[0].x[i], Maps[0].y[i]));
		}
	}

	this.addPlayerName = function(name) {
		this.playersNames.push(name);
	}

	this.deletePlayerName = function(name) {
		this.playersNames.splice(this.playersNames.indexOf(name), 1);
	}

	this.getPlayersNames = function() {
		return this.playersNames;
	}

	this.countOfPlayers = function() {
		return this.players.length - this.freePlayers.length;
	}

	this.getPlayerIndex = function() {
		return this.freePlayers.length > 0 ? this.freePlayers.pop() : this.players.length;
	}

	this.addPlayer = function(name) {
		var playerIndex = this.getPlayerIndex();
		this.players[playerIndex] = new Player(500, 300, name);		// One point for respawn.
		return playerIndex;
	}

	this.deletePlayer = function(id) {
		if(undefined !== this.players[id]) {
			delete this.players[id];
			this.freePlayers.push(id);
		}
	}

	this.getPlayers = function() {
		return {
			players: this.players
		};
	}

	this.getTypeOfGround = function() {
		var type = Math.floor(Math.random() * 4) + 1;
		if(1 === type) return 'desert';
		else if(2 === type) return 'dunes';
		else if(3 === type) return 'grass';
		else return 'snow';
	}

	this.getObjects = function() {
		return {
			id: this.id,
			width: this.width,
			height: this.height,
			ground: this.getTypeOfGround(),
			players: this.players,
			blocks: this.blocks
		}
	}

	this.getBullets = function() {
		return {
			bullets: this.bullets
		};
	}

	this.updatePlayerDirection = function(playerIndex, data) {
		if(undefined !== this.players[playerIndex]) {
			this.players[playerIndex][data.direction] = ('add' === data.command ? 3 : 0);
		}
	}

	this.changePlayerRotation = function(playerIndex, data) {
		if(undefined !== this.players[playerIndex]) {
			this.players[playerIndex].rotation = data.rotation;
		}
	}

	this.createBullet = function(playerIndex, data) {

		if(this.players[playerIndex].ammunition <= 0) return;

		--this.players[playerIndex].ammunition;

		var bullet = new Bullet(this.players[playerIndex].name, this.players[playerIndex].weapon.name);

		if('laser_weapon_1' === this.players[playerIndex].weapon.name) {
			bullet.damage = 1;
		}

		bullet.x = this.players[playerIndex].x + this.players[playerIndex]._w / 2;
		bullet.y = this.players[playerIndex].y + this.players[playerIndex]._h / 2;

		bullet.x -= bullet._w / 2;
		bullet.y -= bullet._h / 2;

		bullet.rotation = this.players[playerIndex].rotation;

		bullet.xspeed = 20 * Math.sin(bullet.rotation / (180 / Math.PI));
		bullet.yspeed = 20 * Math.cos(bullet.rotation / (180 / Math.PI));

		if(this.destroyedBullets.length > 0) {
			this.bullets[this.destroyedBullets[this.destroyedBullets.length - 1]] = bullet;
			this.destroyedBullets.pop();
		} else {
			this.bullets.push(bullet);
		}
	}

	this.updateBullets = function(io) {
		var that = this;
		return setInterval( function() { that.updateBulletsState.call(that, io) }, 20);
	}

	this.updateBulletsState = function(io) {
		if(this.bullets.length > this.destroyedBullets.length) {
			for(var i = 0; i < this.bullets.length; ++i) {

				if(undefined === this.bullets[i]) continue;

				// Update bullets position.
				this.bullets[i].x += this.bullets[i].xspeed;
				this.bullets[i].y -= this.bullets[i].yspeed;
				

				for(var j = 0; j < this.players.length; ++j) {
					if(undefined === this.players[j]) continue;
					if(this.players[j].health > 0 && this.players[j].name !== this.bullets[i].owner && this.checkCollision(this.players[j], this.bullets[i])) {
						this.players[j].health -= this.bullets[i].damage;
						delete this.bullets[i];
						this.destroyedBullets.push(i);
						io.in(this.id).emit('updatePlayers', this.getPlayers());
						if(this.players[j].health <= 0) {
							delete this.players[j];
							this.freePlayers.push(j);
							this.endGame(j, io);
						}
						break;
					}
				}


				if(undefined === this.bullets[i]) continue;


				for(var j = 0; j < this.blocks.length; ++j) {
					if(this.checkCollision(this.blocks[j], this.bullets[i])) {
						delete this.bullets[i];
						this.destroyedBullets.push(i);
						break;
					}
				}
			}
			io.in(this.id).emit('updateBullets', this.getBullets());
		}
	}

	this.updatePlayers = function(io) {
		var that = this;
		return setInterval( function() { that.updatePlayersState.call(that, io) }, 20);
	}

	this.updatePlayersState = function(io) {

		if(1 === this.countOfPlayers()) this.endGame(null, io);

		for(var i = 0; i < this.players.length; ++i) {
			if(undefined !== this.players[i]) {
				
				this.players[i].x += this.players[i].right - this.players[i].left;
				this.players[i].y += this.players[i].down - this.players[i].up;

				for(var j = 0; j < this.blocks.length; ++j) {
					if(this.checkCollision(this.players[i], this.blocks[j])) {
						this.players[i].x -= this.players[i].right - this.players[i].left;
						this.players[i].y -= this.players[i].down - this.players[i].up;
						break;
					}
				}
			}
		}

		io.in(this.id).emit('updatePlayers', this.getPlayers());
	}

	// It's WRONG function for detect collision of two objects, but for 0.0.2 version it will enough.
	this.checkCollision = function(a, b) {
		return Math.abs(2 * a.x - 2 * b.x + a._w - b._w) < (a._w + b._w) && 
			   Math.abs(2 * a.y - 2 * b.y + a._h - b._h) < (a._h + b._h);
	}

	this.generatePowerUps = function(io) {
		var that = this;
		return setInterval(function() { that.createPowerUp.call(that, io); }, 15000);
	}

	this.createPowerUp = function(io) {
		var newPowerUp = new PowerUp();
		newPowerUp.x = Math.floor(Math.random() * this.width);
		newPowerUp.y = Math.floor(Math.random() * this.height);
		var type = Math.random();
		if(type <= 0.5) {
			newPowerUp.type = 'Health';
		} else {
			newPowerUp.type = 'Ammunition';
		}
		var collisionWithBlock = false;
		for(var i = 0; i < this.blocks.length; ++i) {
			if(this.checkCollision(this.blocks[i], newPowerUp)) {
				collisionWithBlock = true;
				break;
			}
		}
		if(newPowerUp.x + newPowerUp._w <= this.width && newPowerUp.y + newPowerUp._h <= this.height && !collisionWithBlock) {
			
			if(this.destroyedPowerUps.length > 0) {
				newPowerUp.id = this.destroyedPowerUps[this.destroyedPowerUps.length - 1];
				this.powerUps[this.destroyedPowerUps[this.destroyedPowerUps.length - 1]] = newPowerUp;
				this.destroyedPowerUps.pop();
			} else {
				newPowerUp.id = this.powerUps.length;
				this.powerUps.push(newPowerUp);
			}

			io.in(this.id).emit('createPowerUp', newPowerUp);

		} else {
			delete newPowerUp;
		}
	}

	this.restorePlayerAttribute = function(playerIndex, data, io) {

		// If something going wrong.
		if(undefined === this.powerUps[data.powerUpId]) return;

		if('Health' === this.powerUps[data.powerUpId].type) this.players[playerIndex].health = Math.min(this.players[playerIndex].health + this.powerUps[data.powerUpId].value, 100);
		else this.players[playerIndex].ammunition = Math.min(this.players[playerIndex].ammunition + this.powerUps[data.powerUpId].value, 100);

		io.in(this.id).emit('destroyPowerUp', { powerUpId: data.powerUpId });
		delete this.powerUps[data.powerUpId];
		this.destroyedPowerUps.push(data.powerUpId);

		io.in(this.id).emit('updatePlayers', this.getPlayers());
	}

	this.destroyPlayer = function(playerIndex, io) {

		if(undefined !== this.players[playerIndex]) {
			this.players[playerIndex].health = 0;
			io.in(this.id).emit('updatePlayers', this.getPlayers());
			delete this.players[playerIndex];
			this.freePlayers.push(playerIndex);
		}

		if(true === this.gameWithBot) {
			clearInterval(this.updateBulletsId);
			clearInterval(this.generatePowerUpsId);
			clearInterval(this.updatePlayersId);
		}
	}

	this.endGame = function(playerIndex, io) {
		
		var that = this;

		setTimeout(function() {

			if(null === playerIndex) {
				
				clearInterval(that.updateBulletsId);
				clearInterval(that.generatePowerUpsId);
				clearInterval(that.updatePlayersId);

				for(var i = 0; i < that.players.length; ++i) {
					if(undefined !== that.players[i]) {
						playerIndex = i;
						delete that.players[i];
						that.freePlayers.push(i);
						break;
					}
				}
			}

			io.in(that.id).emit('endGame', { gameWithBot: that.gameWithBot, playerIndex: playerIndex });

		}, 3000);
	}
};

module.exports = Game;