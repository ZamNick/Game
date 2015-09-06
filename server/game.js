var Player = require('./player.js');
var Bullet = require('./bullet.js');
var PowerUp = require('./powerup.js');
var Block = require('./block.js');

var Game = function() {

	this.id = 0;
	this.gameWithBot = false;
	this.player1 = null;
	this.player2 = null;
	this.bullets = [];
	this.destroyedBullets = [];
	this.blocks = [];
	this.powerUps = [];
	this.destroyedPowerUps = [];

	this.updateBulletsId = 0;
	this.generatePowerUpsId = 0;
	this.updatePlayersId = 0;

	this.setGame = function(data, io) {
		this.id = data.id;
		this.gameWithBot = data.gameWithBot;
		this.player1 = new Player(data.x1, data.y1, data.name1);
		this.player2 = new Player(data.x2, data.y2, data.name2);
		this.updateBulletsId = this.updateBullets(io);
		this.generatePowerUpsId = this.generatePowerUps(io);
		this.updatePlayersId = this.updatePlayers(io);
		this.blocks = [ new Block(300, 500), new Block(346, 500), new Block(300, 455), new Block(346, 455),
						new Block(300, 100), new Block(346, 100), new Block(300, 145), new Block(346, 145),
						new Block(900, 500), new Block(946, 500), new Block(900, 455), new Block(946, 455),
						new Block(900, 100), new Block(946, 100), new Block(900, 145), new Block(946, 145) ];
	}

	// Return the main objects of the game. In the beginning
	// there are no bullets, destroyed bullets, powerups and
	// destroyed powerups on the game.
	this.getObjects = function() {
		return {
			id: this.id,
			player1: this.player1,
			player2: this.player2,
			blocks: this.blocks
		}
	}

	this.getPlayersPositions = function() {
		return {
			x1: this.player1.x,
			y1: this.player1.y,
			name1: this.player1.name,
			x2: this.player2.x,
			y2: this.player2.y
		};
	}

	this.getPlayersRotations = function() {
		return {
			rotation1: this.player1.rotation,
			name1: this.player1.name,
			rotation2: this.player2.rotation
		};
	}

	this.getPlayersAmmunitions = function() {
		return {
			ammunition1: this.player1.ammunition,
			name1: this.player1.name,
			ammunition2: this.player2.ammunition
		};
	}

	this.getBullets = function() {
		return {
			bullets: this.bullets
		};
	}

	this.updatePlayerDirection = function(data) {
		if(data.name === this.player1.name) {
			this.player1[data.direction] = ('add' === data.command ? 3 : 0);
		} else {
			this.player2[data.direction] = ('add' === data.command ? 3 : 0);
		}
	}

	this.changePlayerPosition = function(data) {
		if(data.name === this.player1.name) {
			this.player1.x = data.x;
			this.player1.y = data.y;
		} else {
			this.player2.x = data.x;
			this.player2.y = data.y;
		}
	}

	this.changePlayerRotation = function(data) {
		if(data.name === this.player1.name) {
			this.player1.rotation = data.rotation;
		} else {
			this.player2.rotation = data.rotation;
		}
	}

	this.createBullet = function(data) {

		if(data.owner === this.player1.name) {
			--this.player1.ammunition;
		} else {
			--this.player2.ammunition;
		}

		var bullet = new Bullet(data.x, data.y, data.rotation, data.owner);

		bullet.xspeed = 20 * Math.sin(bullet.rotation / (180 / Math.PI));
		bullet.yspeed = 20 * Math.cos(bullet.rotation / (180 / Math.PI));

		if('Weapon1' === data.type) {
			bullet._w = 5;
			bullet._h = 13;
			bullet.damage = 1;
		}

		bullet.x -= bullet._w / 2;
		bullet.y -= bullet._h / 2;

		if(this.destroyedBullets.length) {
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

				if(this.bullets[i] === undefined) continue;

				// Update bullets position.
				this.bullets[i].x += this.bullets[i].xspeed;
				this.bullets[i].y -= this.bullets[i].yspeed;


				// Don't allow bullet go out of screen.
				if(this.bullets[i].x < 0 || 
				   this.bullets[i].y < 0 || 
				   this.bullets[i].x > 2000 || 
				   this.bullets[i].y > 2000) {
					delete this.bullets[i];
					this.destroyedBullets.push(i);
					continue;
				}


				if(this.player1.health > 0 && this.player1.name !== this.bullets[i].owner && this.checkCollision(this.player1, this.bullets[i])) {
					this.player1.health -= this.bullets[i].damage;
					delete this.bullets[i];
					this.destroyedBullets.push(i);
					io.in(this.id).emit('updatePlayerHealth', {
						id: this.id,
						name1: this.player1.name,
						health: this.player1.health
					});
					if(this.player1.health <= 0) {
						var that = this;
						setTimeout(function() { that.endGame.call(that, io); }, 3000);
					}
					continue;
				}


				if(this.player2.health > 0 && this.player2.name !== this.bullets[i].owner && this.checkCollision(this.player2, this.bullets[i])) {
					this.player2.health -= this.bullets[i].damage;
					delete this.bullets[i];
					this.destroyedBullets.push(i);
					io.in(this.id).emit('updatePlayerHealth', {
						id: this.id,
						name1: this.player2.name,
						health: this.player2.health
					});
					if(this.player2.health <= 0) {
						var that = this;
						setTimeout(function() { that.endGame.call(that, io); }, 3000);
					}
					continue;
				}


				for(var j = 0; j < this.blocks.length; ++j) {
					if(this.checkCollision(this.blocks[j], this.bullets[i])) {
						delete this.bullets[i];
						this.destroyedBullets.push(i);
						break;
					}
				}
			}
			io.in(this.id).emit('updateBullets', {
				id: this.id,
				bullets: this.bullets
			});
		}
	}

	this.updatePlayers = function(io) {
		var that = this;
		return setInterval( function() { that.updatePlayersState.call(that, io) }, 20);
	}

	this.updatePlayersState = function(io) {

		this.player1.x += this.player1.right - this.player1.left;
		this.player1.y += this.player1.down - this.player1.up;

		for(var i = 0; i < this.blocks.length; ++i) {
			if(this.checkCollision(this.player1, this.blocks[i])) {
				this.player1.x -= this.player1.right - this.player1.left;
				this.player1.y -= this.player1.down - this.player1.up;
				break;
			}
		}

		this.player2.x += this.player2.right - this.player2.left;
		this.player2.y += this.player2.down - this.player2.up;

		for(var i = 0; i < this.blocks.length; ++i) {
			if(this.checkCollision(this.player2, this.blocks[i])) {
				this.player2.x -= this.player2.right - this.player2.left;
				this.player2.y -= this.player2.down - this.player2.up;
				break;
			}
		}

		io.in(this.id).emit('updatePlayersPositions', {
			x1: this.player1.x,
			y1: this.player1.y,
			name1: this.player1.name,
			x2: this.player2.x,
			y2: this.player2.y
		});
	}

	// It's WRONG function for detect collision of two objects, but for 0.0.1 version it will enough.
	this.checkCollision = function(obj, bullet) {
		return Math.abs(2 * obj.x - 2 * bullet.x + obj._w - bullet._w) < (obj._w + bullet._w) && 
			   Math.abs(2 * obj.y - 2 * bullet.y + obj._h - bullet._h) < (obj._h + bullet._h);
	}

	this.generatePowerUps = function(io) {
		var that = this;
		return setInterval(function() { that.createPowerUp.call(that, io); }, 15000);
	}

	this.createPowerUp = function(io) {
		var newPowerUp = new PowerUp();
		newPowerUp.x = Math.floor(Math.random() * 1300);
		newPowerUp.y = Math.floor(Math.random() * 800);
		var type = Math.random();
		if(type <= 0.5) {
			newPowerUp.type = 'Heal';
			newPowerUp._w = 37;
			newPowerUp._h = 34;
		} else {
			newPowerUp.type = 'Ammunition';
			newPowerUp._w = 37;
			newPowerUp._h = 36;
		}
		var collisionWithBlock = false;
		for(var i = 0; i < this.blocks.length; ++i) {
			if(this.checkCollision(this.blocks[i], newPowerUp)) {
				collisionWithBlock = true;
				break;
			}
		}
		if(newPowerUp.x + newPowerUp._w <= 1300 && newPowerUp.y + newPowerUp._h <= 800 && !collisionWithBlock) {
			
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

	this.restorePlayerHealth = function(data, io) {
		// If something going wrong.
		if(undefined === this.powerUps[data.powerUpId]) return;

		if(data.name === this.player1.name) this.player1.health = Math.min(this.player1.health + this.powerUps[data.powerUpId].value, 100);
		else this.player2.health = Math.min(this.player2.health + this.powerUps[data.powerUpId].value, 100);
		io.in(this.id).emit('destroyPowerUp', { powerUpId: data.powerUpId });
		io.in(this.id).emit('updatePlayerHealth', {
			id: this.id,
			name1: data.name,
			health: (data.name === this.player1.name ? this.player1.health : this.player2.health)
		});
		delete this.powerUps[data.powerUpId];
		this.destroyedPowerUps.push(data.powerUpId);
	}

	this.restorePlayerAmmunition = function(data, io) {
		// If something going wrong.
		if(undefined === this.powerUps[data.powerUpId]) return;
		
		if(data.name === this.player1.name) this.player1.ammunition = Math.min(this.player1.ammunition + this.powerUps[data.powerUpId].value, 100);
		else this.player2.ammunition = Math.min(this.player2.ammunition + this.powerUps[data.powerUpId].value, 100);
		io.in(this.id).emit('destroyPowerUp', { powerUpId: data.powerUpId });
		io.in(this.id).emit('updatePlayerAmmunition', {
			id: this.id,
			name1: data.name,
			ammunition: (data.name === this.player1.name ? this.player1.ammunition : this.player2.ammunition)
		});
		delete this.powerUps[data.powerUpId];
		this.destroyedPowerUps.push(data.powerUpId);
	}

	this.destroyPlayer = function(name, io) {

		if(this.player1.name === name) {

			this.player1.health = 0;

			io.in(this.id).emit('updatePlayerHealth', {
				id: this.id,
				name1: this.player1.name,
				health: this.player1.health
			});
		} else {

			this.player2.health = 0;

			io.in(this.id).emit('updatePlayerHealth', {
				id: this.id,
				name1: this.player2.name,
				health: this.player2.health
			});
		}

		var that = this;
		setTimeout(function() { that.endGame.call(that, io); }, 3000);
	}

	this.endGame = function(io) {
		clearInterval(this.updateBulletsId);
		clearInterval(this.generatePowerUpsId);
		clearInterval(this.updatePlayersId);
		io.in(this.id).emit('endGame', { gameWithBot: this.gameWithBot });
	}
};

module.exports = Game;