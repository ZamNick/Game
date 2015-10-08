var Bullet = function(x, y, rotation, owner) {

	this.x = x;
	this.y = y;
	this._w = 5;
	this._h = 13;
	this.rotation = rotation;
	this.xspeed = 0;
	this.yspeed = 0;
	this.damage = 0;
	this.owner = owner;
	this.type = '';

}

module.exports = Bullet;