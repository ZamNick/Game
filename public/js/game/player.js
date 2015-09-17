/**
 * Player object is represented in this file.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/
Crafty.c("Player", {



	/**
	 * Default values.<br />
	 **/
	x: 10,
	y: 10,
	name: 'Player',
	radius: 15,
	health: 100,
	movementSpeed: 4,
	ammunition: 100,
	weapon: {
		firerate: 5,
		name: 'Weapon1'
	},
	attack: false,

	up: false,
	down: false,
	left: false,
	right: false,



	/**
	 * Create player object and binding it to all main behaviors and effect
 	 * that can be occured.<br />
	 * 
	 * @constructor
	 * @function
	 * @public
	 * @param {Number} x - Player's start x-coordinate.
	 * @param {Number} y - Player's start y-coordinate.
	 * @param {Number} gameId - ID of the current game.
	 * @param {Object} socket - Current connection to server.
	 * @return {Object}
	 **/
	__init: function(x, y, name, gameId, socket) {

		this.requires("2D, Canvas, robot_1, Sprite, HealthBar, AmmunitionBar")
			.origin('center')

			.bind('KeyDown', function(e) {

				var direction = '';

			    if(e.key === Crafty.keys.LEFT_ARROW) {
			      direction = 'left';
			      if(this.left === true) return;
			      this.left = true;
			    } else if (e.key === Crafty.keys.RIGHT_ARROW) {
			      direction = 'right';
			      if(this.right === true) return;
			      this.right = true;
			    } else if (e.key === Crafty.keys.UP_ARROW) {
			      direction = 'up';
			      if(this.up === true) return;
			      this.up = true;
			    } else if (e.key === Crafty.keys.DOWN_ARROW) {
			      direction = 'down';
			      if(this.down === true) return;
			      this.down = true;
			    }

				this.trigger('updatePlayerDirection', { command: 'add', direction: direction });
			})
			.bind('KeyUp', function(e) {

				var direction = '';

			    if(e.key === Crafty.keys.LEFT_ARROW) {
			      direction = 'left';
			      this.left = false;
			    } else if (e.key === Crafty.keys.RIGHT_ARROW) {
			      direction = 'right';
			      this.right = false;
			    } else if (e.key === Crafty.keys.UP_ARROW) {
			      direction = 'up';
			      this.up = false;
			    } else if (e.key === Crafty.keys.DOWN_ARROW) {
			      direction = 'down';
			      this.down = false;
			    }

			    this.trigger('updatePlayerDirection', { command: 'delete', direction: direction });
			})
			.bind('EnterFrame', function(frame) {
				if(frame.frame % this.weapon.firerate == 0) {
					if(this.ammunition > 0 && this.attack) {
						this.shoot();
					}
				}
			})
			.bind('Hurt', function() {
				Crafty.e('Damage').attr({
					x: this.x,
					y: this.y
				});
			})
			.bind('Stop', function() {
				if(undefined !== socket) {
				 	socket.emit('stopPlayer', {
				 		id: gameId,
				 		name: this.name,
				 		x: this.x - this._movement.x,
				 		y: this.y - this._movement.y
				 	});
			 	}
			})
			.bind('RestoreHealth', function(powerUpId) {
				if(undefined !== socket) {
					socket.emit('RestorePlayerHealth', {
						id: gameId,
						powerUpId: powerUpId,
						name: this.name
					});
				}
			})
			.bind('RestoreAmmunition', function(powerUpId) {
				if(undefined !== socket) {
					socket.emit('RestorePlayerAmmunition', {
						id: gameId,
						powerUpId: powerUpId,
						name: this.name
					});
				}
			})
			.bind('updatePlayerDirection', function(data) {
				if(undefined !== socket) {
				    socket.emit('updatePlayerDirection', {
				    	id: gameId,
				    	name: this.name,
				    	command: data.command,
				    	direction: data.direction
				    });
				}
			})
			.bind('changeRobotNamePosition', function() {
				robotName.attr({
				 	x: this.x - name.length * 3 + this.radius,
				 	y: this.y + 2 * this.radius + 10
				});
			})
			.bind('changeHealthBarPosition', function() {
				healthbar.attr({
					x: this.x - 2 * this.radius,
					y: this.y - 20
				});
			})
			.bind('changeAmmunitionBarPosition', function() {
				ammunitionbar.attr({
					x: this.x - 2 * this.radius,
					y: this.y - 25
				});
			})
			.bind('changeHealthBarValue', function() {
				healthbar.attr({ health: this.health });
			})
			.bind('changeAmmunitionBarValue', function() {
				ammunitionbar.attr({ ammunition: this.ammunition });
			})
			.bind('sendRotationToServer', function(e) {
				socket.emit('changePlayerRotation', {
					id: gameId,
					name: this.name,
					rotation: Math.round((180 * (Math.PI / 2 + Math.atan2(e.pageY - this.y - this.radius, e.pageX - this.x - this.radius))) / Math.PI)
				});
			})
			.bind('createBulletOnServer', function() {
				socket.emit('createBullet', {
					id: gameId,
					x: this.x + this._w / 2,
					y: this.y + this._h / 2,
					rotation: this._rotation,
					type: this.weapon.name,
					owner: this.name
				});
			})
			.bind('Die', function() {
				healthbar.destroy();
				ammunitionbar.destroy();
				robotName.destroy();
				this.die();
			});


		// Starting initialization.
		this.attr({
			x: x,
			y: y,
			name: name
		});

		// Create player's robot name.
		var robotName = Crafty.e('2D, DOM, Text')
						 .text(this.name)
						 .textColor('rgb(249, 38, 114)')
						 .textFont({
						 	size: '12px',
						 	weight: 'bold'
						 })
						 .unselectable()
						 .attr({
						 	x: this.x - name.length * 3 + this.radius,
						 	y: this.y + 2 * this.radius + 10
						 });


		// Create player's health bar.
		var healthbar = Crafty.e('HealthBar')
								.__init(this.x - 2 * this.radius, this.y - 20, this.health);


		// Create player's ammunition bar.
		var ammunitionbar = Crafty.e('AmmunitionBar')
									.__init(this.x - 2 * this.radius, this.y - 25, this.ammunition);


		return this;
	},
	die: function() {
		this.destroy();
		Crafty.e('Explosion').attr({
			x: this.x - 68 + this._w / 2,	// The width of the explosion.png is 136px, so the half of this will be 68px
			y: this.y - 64 + this._h / 2	// Similarly will be with height.
		});
	},
	shoot: function() {
		this.trigger('createBulletOnServer');
	},
	onMouseDown: function() {
		this.attack = true;
	},
	onMouseUp: function() {
		this.attack = false;
	},
	onMouseMove: function(e) {
		//this.rotation = Math.round((180 * (Math.PI / 2 + Math.atan2(e.pageY - this.y - this.radius, e.pageX - this.x - this.radius))) / Math.PI);
		this.trigger('sendRotationToServer', e);
	}
});