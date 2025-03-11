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
		this.y = 0.5;
		this.role = role; // "player1" or "player2"
		if (this.role === "player1")
			this.x = 0;
		else
			this.x = canvas.width - this.width;
	}
 
	setVars(data) {
		this.width = this.canvas.width * data.padW / data.canvasX;
		this.height = this.canvas.height * data.padH / data.canvasY;
		this.speed = data.padS;
	}

	draw(ctx) {
		const topY = this.y * this.canvas.height - this.height / 2;
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, topY, this.width, this.height);
	}

	move(socket) {
		const oldY = this.y
		const relH = (this.height / this.canvas.height) / 2;
		if (this.up && this.y > 0)
			this.y -= this.speed;
		if (this.down && this.y < (this.canvas.height - this.height))
			this.y += this.speed;
	
		if (this.y - relH <= 0)
			this.y = relH;
		else if (this.y + relH >= 1)
			this.y = 1 - relH;
		if (socket.readyState === WebSocket.OPEN && this.y != oldY)
			this.send(socket);
	}

	update(players, newScore) {
		if (!this.role)
			return ;
		if (players[this.role] && players[this.role]["y"])
			this.y = players[this.role]["y"];
		if (newScore[this.role])
			this.score = newScore[this.role];
	}

	drawScore(ctx) {
		const text = this.whoAmI + ": " + this.score;
		let x;
		let fontSize = Math.floor(this.canvas.width * 0.05);
		ctx.fillStyle = "rgb(100, 100, 100 / 50%)";
		ctx.font = `${fontSize}px Arial`;
		if (this.x == 0)
			x = this.canvas.width / 4 - ctx.measureText(text).width / 2;
		else
			x = this.canvas.width * 0.75 - ctx.measureText(text).width / 2;
		ctx.fillText(text, x, this.canvas.height / 10);
	}

	displayEndgameMessage(ctx, oppScore, msg) {
		let div = document.getElementById("wait");
		let fontSize = Math.floor(this.canvas.width * 0.05);

		if (div) {
			if (this.role == "player1")
				div.innerHTML = msg + `<br>${this.score} - ${oppScore}`;
			else
				div.innerHTML = msg + `<br>${oppScore} - ${this.score}`;

			div.style.display = "block";
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.fillStyle = "rgba(0 0 0 / 25%)";
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

			div.style.fontSize = Math.floor(this.canvas.width * 0.05) + "px";
			console.log("endgameMsg: " + msg);
		}
	}

	send(socket) {
		if (socket.readyState === WebSocket.OPEN)
		{
			const data = {
				"type": "update",
				"role": this.role,
				"y": this.y,
				"score": this.score,
			};
			socket.send(JSON.stringify(data));
		}
	}


	resize(nW, nH) {
		const factor = nH / this.canvas.height;

		this.width = this.width * nW / this.canvas.width;
		this.height = this.height * factor;
		if (this.x != 0)
			this.x = nW - this.width;
		this.y = this.y * factor;
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

	resize(nW, nH) {
		const factor = nH / this.canvas.height;

		this.radius = this.radius * factor;
		this.x = this.x * nW / this.canvas.width;
		this.y = this.y * factor;

	}
}
