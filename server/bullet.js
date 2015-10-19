var Bullet = function(owner, type) {

	this.x = 0;
	this.y = 0;
	this._w = 5;
	this._h = 13;
	this.rotation = 0;
	this.xspeed = 0;
	this.yspeed = 0;
	this.damage = 0;
	this.owner = owner;
	this.type = type;

}

module.exports = Bullet;