/**
 * Main game object is represented in this file.<br />
 *
 * Make it not like a component but like an object, because no needs
 * to make several games in one time. At any time there is only one game.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.2
 **/
Game = {



	/**
	 * Make initializing and start game.<br />
	 * 
	 * @see http://craftyjs.com/api/Crafty-scene.html
	 * @see http://craftyjs.com/api/Crafty-stage.html
	 * @function
	 * @public
	 * @param {Object} obj - Player's starting dataset.
	 * @return {void}
	 **/
	start: function(obj) {

		// Initializing.
	    Crafty.init(window.innerWidth, window.innerHeight);

	    if(document.getElementById('cr-stage')) {
	    	document.getElementById('cr-stage').style.display = 'block';
	    }

	    // Start game.
		Crafty.scene('Game', obj);

		Crafty.canvas._canvas.style.background = "url('public/img/desert.png') repeat";
	}



}