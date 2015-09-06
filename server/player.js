var Player = function(x, y, name) {

	this.x = x;
	this.y = y;
	this._w = 39;
	this._h = 30;
	this.name = name;
	this.raduis = 15;
	this.health = 100;
	this.movementSpeed = 4;
	this.ammunition = 100;
	this.rotation = 0;
	this.weapon = {
		firerate: 5,
		name: 'Weapon1'
	}
	this.attack = false;

	this.up = 0;
	this.down = 0;
	this.left = 0;
	this.right = 0;

}

module.exports = Player;