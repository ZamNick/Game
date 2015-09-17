/**
 * Interface of all power ups contains in this file.<br />
 *
 * Power ups is a some object that increase your health or ammunition.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/



/**
 * Base class of power ups.<br />
 **/
Crafty.c('PowerUp', {

	id: 0,
	


	/**
	 * Create abstract power ups, add needed components and bind handler for collision with player.<br />
	 *
	 * @constructor
	 * @function
	 * @public
	 * @return {Object}
	 **/
	init: function() {
		this.addComponent('2D, Canvas, Collision')
			.onHit('Player', function(entity) {
				entity[0].obj.trigger(this.effect, this.id);
				this.destroy();
			});
	}
});



/**
 * Power ups that increase your health.<br />
 **/
Crafty.c('Heal', {

	effect: "RestoreHealth",

	

	/**
	 * Create Heal power up by using base class PowerUp and binding it with 'heal' sprite.<br />
	 * 
	 * @constructor
	 * @function
	 * @public
	 * @return {Object}
	 **/
	init: function() {
		this.addComponent('PowerUp, health');
	}
});



/**
 * Power ups that increase your ammunition.<br />
 **/
Crafty.c('Ammunition', {

	effect: "RestoreAmmunition",

	

	/**
	 * Create Ammunition power up by using base class PowerUp and binding it with 'ammo' sprite.<br />
	 * 
	 * @constructor
	 * @function
	 * @public
	 * @return {Object}
	 **/
	init: function() {
		this.addComponent('PowerUp, ammunition');
	}
});