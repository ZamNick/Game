var BulletsPull = function() {

	this.bullets = [];

	(function(bullets) {
		for(var i = 0; i < 500; ++i) {
			bullets.push(Crafty.e('Bullet'));
			bullets[bullets.length - 1].attr({ x: -1, y: -1 });
		}
	})(this.bullets);

	this.resize = function() {
		for(var i = 0; i < 50; ++i) {
			this.bullets.push(Crafty.e('Bullet'));
			this.bullets[this.bullets.length - 1].attr({ x: -1, y: -1 });
		}
	}

	this.getBullet = function(type) {
		if(0 === this.bullets.length) {
			this.resize();
		}
		var bullet = this.bullets.pop();
		bullet.addComponent(type);
		bullet.type = type;
		bullet.origin('center');
		return bullet;
	}

	this.returnBullet = function(bullet) {
		bullet.removeComponent(bullet.type);
		bullet.attr({ x: -1, y: -1 });
		this.bullets.push(bullet);
	}
}