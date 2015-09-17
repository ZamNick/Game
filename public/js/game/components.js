/**
 * All helpfull components of the game.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/



/**
 * Component represent a line that display your current health value in graphic form.
 * In addiction of health value bar can be green( >= 75 ), yellow( < 75 && >= 35 ) or red( < 35 ).<br />
 **/
Crafty.c('HealthBar', {

	health: 100, // delete ?!
	bar: [false, false, false],



	/**
	 * Initialize HealthBar object by adding needed components for display.
	 * On each frame, object check health value and update sprite of bar if it needed.<br />
	 *
	 * @see http://craftyjs.com/api/Sprite.html#-crop
	 * @constructor
	 * @function
	 * @public
	 * @param {Number} x - Object's x-coordinate.
	 * @param {Number} y - Object's y-coordinate.
	 * @param {Number} health - Current count of health.
	 * @return {Object}
	 **/
	__init: function(x, y, health) {
		this.addComponent('2D, Canvas, Sprite')
			.bind('EnterFrame', function() {

				if(true === this.bar[0]) this.removeComponent('health_bar_1');
				if(true === this.bar[1]) this.removeComponent('health_bar_2');
				if(true === this.bar[2]) this.removeComponent('health_bar_3');

				if(this.health >= 75) {
					this.bar[0] = true;
					this.bar[1] = false;
					this.bar[2] = false;
					this.addComponent('health_bar_1');
				} else if(this.health < 75 && this.health >= 35) {
					this.bar[0] = false;
					this.bar[1] = true;
					this.bar[2] = false;
					this.addComponent('health_bar_2');
				} else {
					this.bar[0] = false;
					this.bar[1] = false;
					this.bar[2] = true;
					this.addComponent('health_bar_3');
				}

				if(this.health > 0) {
					this.crop(0, 0, this.health, 5);
				} else {

					// Firefox and IE cannot draw picture with 0px width.
					this.x = -100;
					this.y = -100;
				}
			});


		// Start initialization
		this.attr({
			x: x,
			y: y,
			health: health
		});


		return this;
	}
});



/**
 * Component represent a line that display your current ammunition value in graphic form.
 * So, in each frame you can see how many of ammunition you have.<br />
 **/
Crafty.c('AmmunitionBar', {
	
	ammunition: 100, // delete ?!

	

	/**
	 * Initialize AmmunitionBar object by adding needed components for display.
	 * On each frame, object check ammunition value and update bar if it needed.<br />
	 * 
	 * @see http://craftyjs.com/api/Sprite.html#-crop
	 * @constructor
	 * @function
	 * @public
	 * @param {Number} x - Object's x-coordinate.
	 * @param {Number} y - Object's y-coordinate.
	 * @param {Number} ammunition - Current count of ammunition.
	 * @return {Object}
	 **/
	__init: function(x, y, ammunition) {
		this.addComponent('2D, Canvas, Sprite, ammunition_bar')
			.bind('EnterFrame', function() {

				if(this.ammunition > 0) {
					this.crop(0, 0, this.ammunition, 5);
				} else {

					// Firefox and IE cannot draw picture with 0px width.
					this.x = -100;
					this.y = -100;
				}
			});


		// Start initialization
		this.attr({
			x: x,
			y: y,
			ammunition: ammunition
		});


		return this;
	}
});



/**
 * Component represent a static object that cannot move and cannot be destruct by someone player.
 * Player cannot move through Block object and any power up cannot appear on it.<br />
 **/
Crafty.c('Block', {



	/**
	 * Initialize Block object by adding needed components for display.
	 * Make Block object Solid. It means that object cannot move anywhere.
	 * Load corresponding sprites for Block object.<br />
	 *
	 * @constructor
	 * @function
	 * @public
	 * @param {Number} x - Object's x-coordinate.
	 * @param {Number} y - Object's y-coordinate.
	 * @return {Object}
	 **/
	__init: function(x, y) {

		// Bounded Block component with block.png and make it Solid.
		this.addComponent('2D, Canvas, Solid, block');


		// Start initialization.
		this.attr({
			x: x,
			y: y
		});


		return this;
	}
});