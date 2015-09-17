/**
 * All effects in the game.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/



/**
 * Component represent an explosion effect when player has no health.<br />
 **/
Crafty.c('Explosion', {



	/**
	 * Initialize Explosion object by adding needed components for display.
	 * Create explosion animation and show it to player when he has no health.<br />
	 *
	 * @see http://craftyjs.com/api/SpriteAnimation.html#-reel
	 * @constructor
	 * @function
	 * @public
	 **/
	init: function() {
		this.addComponent('2D, Canvas, explosion, SpriteAnimation')
			.reel('explosion', 500, 0, 0, 16)
			.animate('explosion')
			.bind('AnimationEnd', function() {
				this.destroy();
			});

			// TODO: Add audio for explosion.
			Crafty.audio.play("explosion");
	}
});



/**
 * Component represent a damage effect when player with enemy bullet collision occured.<br />
 **/
Crafty.c('Damage', {



	/**
	 * Initialize Damate effect by adding needed components for display.
	 * Load damage sprite and show it to player during 0.1 second.<br />
	 * 
	 * @see http://craftyjs.com/api/Delay.html#-delay
	 * @constructor
	 * @function
	 * @public
	 **/
	init: function() {
		this.addComponent('2D, Canvas, Delay, damage')
			.delay(function() { this.destroy(); }, 100);
	}
});