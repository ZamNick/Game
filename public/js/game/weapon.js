/**
 * Interface of all weapons contains in this file.<br />
 *
 * By this interface player is able to make shooting and decrease opponent health.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 **/



Crafty.c("Bullet", {



	/**
	 * Initialize Bullet object by adding some needed components.<br />
	 *
	 * @constructor
	 * @function
	 * @public
	 **/
	init: function() {
		this.addComponent("2D", "Canvas");

		//Crafty.audio.play("laser_weapon_1");
	}
});



Crafty.c("Weapon1", {



	/**
	 * Initialize Weapon1 object by adding Bullet component for make shooting and 'laser' sprites for view.<br />
	 *
	 * @see http://craftyjs.com/api/2D.html#-origin
	 * @constructor
	 * @function
	 * @public
	 **/
	init: function() {
		this.addComponent("Bullet", "laser_weapon_1")
			.origin('center');
	}
});