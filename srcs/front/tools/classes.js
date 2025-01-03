export class Player {
    width = 10;
    height = 80;
    maxScore = 5;

    constructor(canvas, initPos = (canvas.width - this.width)) {
        this.x = initPos;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 5;
        this.color = "white";
        this.up = false;
        this.down = false;
        this.score = 0;
        this.canvas = canvas;
		this.lastMoveTime = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

	move(socket) {
	    const now = Date.now();
	    if (this.up && this.y > 0)
			this.y -= this.speed;
	    if (this.down && this.y < (this.canvas.height - this.height))
			this.y += this.speed;
	
	    // Send updates only every 100ms
	    if (socket.readyState === WebSocket.OPEN && now - this.lastMoveTime > 100)
		{
	        this.lastMoveTime = now;
	        socket.send(JSON.stringify({
	            type: "paddleMove",
	            position: this.y
	        }));
	    }
	}

    update(newY) {
        this.y = newY;
    }

    drawScore(ctx, playerID) {
        let x;
        ctx.fillStyle = "white";
        ctx.font = "40px Calibri";
        if (playerID === 1)
            x = this.canvas.width / 4;
        else
            x = this.canvas.width * 3 / 4;
        ctx.fillText(`Score: ${this.score}`, x, 30);
    }

    scored(socket) {
        this.score++;
        const data = {
            type: "scoreUpdate",
            score: this.score,
        };
        if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(data));
    }

    displayEndgameMessage(ctx, finalScore) {
        const message =
            this.score === this.maxScore
                ? "Congratulations! You've won!"
                : "Better luck next time!";
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "50px Calibri";
        ctx.textAlign = "center";
        ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 20);
        ctx.font = "40px Arial";
        ctx.fillText(finalScore, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
}


export class Ball {
    radius = 10;

    constructor(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.xspeed = 5;
        this.yspeed = 5;
        this.color = "white";
        this.canvas = canvas;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    update(newX, newY) {
        // Update ball position from server data
        this.x = newX;
        this.y = newY;
    }

    resetPosition() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
    }

	move(player, opponent, loopID, socket) {
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

        if (this.x <= 0)
		{
            opponent.scored(loopID);
            this.resetPosition();
        }
        else if (this.x + this.radius >= this.canvas.width)
		{
            player.scored(loopID);
            this.resetPosition();
        }
        const data = { type: "ballPosition", xpos: this.x, ypos: this.y };
        if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(data));
        
    }
}
