export class Player {
	maxScore = 5;

	constructor(canvas, role) {
		console.log(`Canvas size: ${canvas.width} x ${canvas.height}`)
		this.color = "white";
		this.up = false;
		this.down = false;
		this.score = 0;
		this.canvas = canvas;
		this.whoAmI = null;
		this.role = role; // "player1" or "player2"
		if (this.role === "player1")
			this.x = 0;
		else
			this.x = canvas.width - this.width;
	}
 
	setVars(data) {
		this.width = this.canvas.width * data.padW / data.canvasX;
		this.height = this.canvas.height * data.padH / data.canvasY;
		this.speed = this.canvas.height * data.padS;
		this.y = (this.canvas.height - this.width) / 2
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		//if (this.role === "player1")
		//	console.log("paddles: x " + this.x + "\ny: " + this.y + "\nwidth: " + this.width + "\nheight: " + this.height);
	}

	move(socket) {
		const oldY = this.y
		if (this.up && this.y > 0)
			this.y -= this.speed;
		if (this.down && this.y < (this.canvas.height - this.height))
			this.y += this.speed;
	
		if (socket.readyState === WebSocket.OPEN && this.y != oldY)
			this.send(socket);
	}

	update(players, newScore) {
		if (!this.role)
			return ;
		if (players[this.role] && players[this.role]["y"])
			this.y = players[this.role]["y"] * this.canvas.height;
		if (newScore[this.role])
			this.score = newScore[this.role];
	}

	drawScore(ctx) {
		let x;
		let fontSize = Math.floor(this.canvas.width * 0.05);
		ctx.fillStyle = "rgb(100, 100, 100 / 50%)";
		ctx.font = `${fontSize}px Arial`;
		if (this.x == 0)
			x = this.canvas.width / 4;
		else
			x = this.canvas.width * 3 / 4;
		ctx.fillText(`Score: ${this.score}`, x, this.canvas.height / 10);
	}

	displayEndgameMessage(ctx, oppScore, msg) {
		let finalScore;
		if (this.role == "player1")
			finalScore = `${this.score} - ${oppScore}`;
		else
			finalScore = `${oppScore} - ${this.score}`;
		let fontSize = Math.floor(this.canvas.width * 0.05);

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.fillStyle = "white";
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.fillText(msg, this.canvas.width / 2, this.canvas.height / 2 - 20);
		ctx.font = `${fontSize - 5}px Arial`;
		ctx.fillText(finalScore, this.canvas.width / 2, this.canvas.height / 2 + 30);
	}

	send(socket) {
		if (socket.readyState === WebSocket.OPEN)
		{
			const data = {
				"type": "update",
				"role": this.role,
				"y": this.y / this.canvas.height,
				"score": this.score,
			};
			socket.send(JSON.stringify(data));
		}
	}

	resize(canvas) {
		const factor = canvas.height / this.canvas.height;

		console.warn(`resize player: old W: ${this.canvas.width} old H: ${this.canvas.height}\n` +
						`resize player: new W: ${canvas.width} new H: ${canvas.height}`);
		this.width = this.width * canvas.width / this.canvas.width;
		//console.log(`resize: pre height ${this.height}`);
		this.height = this.height * factor;
		//console.log(`resize: post height ${this.height}`);
		if (this.x != 0)
			this.x = canvas.width - this.width;
		this.y = this.y * factor;
		this.canvas = canvas
	}
}


export class Ball {
	radFactor = 0.01;

	constructor(canvas) {
		this.canvas = canvas;
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;
		this.color = "white";
	}

	setVars(data) {
		this.radius = this.canvas.width * data.ballRad / data.canvasX;
		this.xspeed = this.canvas.width * data.ballSx / data.canvasX;
		this.yspeed = this.canvas.height * data.ballSy / data.canvasY;
		this.x = this.canvas.width / 2;
		this.y = this.canvas.height / 2;
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fill();
	}

	resetPosition() {
		this.x = this.canvas.width / 2;
		this.y = this.canvas.height / 2;
	}

	move(player, opponent, loopID) {
		this.x += this.xspeed;
		this.y += this.yspeed;

		//Top and bottom wall collision
		if (this.y <= 0 || this.y + this.radius >= this.canvas.height)
			this.yspeed = -this.yspeed;

		//Left paddle (player) collision
		if (this.x <= player.width && this.y + this.radius >= player.y
			&& this.y <= player.y + player.height)
			this.xspeed = -this.xspeed;

		//Right paddle (opponent) collision
		else if (this.x + this.radius >= this.canvas.width - opponent.width
			&& this.y + this.radius >= opponent.y
			&& this.y <= opponent.y + opponent.height)
			this.xspeed = -this.xspeed;
	}

	resize(canvas) {
		const factor = canvas.height / this.canvas.height;

		this.radius = this.radius * factor;
		this.x = this.x * canvas.width / this.canvas.width;
		this.y = this.y * factor;
		this.canvas = canvas;
	}
}
