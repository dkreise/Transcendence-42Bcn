export class Player {

    width = 10;
	height = 80;
	maxScore = 5;

    constructor(canvas, role, initPos = (canvas.width - this.width)) {
        // this.width = 10;
        // this.height = 80;
        this.x = initPos;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 5;
        this.color = "white";
        this.up = false;
        this.down = false;
        this.score = 0;
        this.role = role;
        this.canvas = canvas;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move() {
        if (this.up && this.y > 0) 
            this.y -= this.speed;
        if (this.down && this.y < this.canvas.height - this.height) 
            this.y += this.speed;
    }

    // update(newScore) {
	// 	this.score = newScore;
	// }

    drawScore(ctx, playerID) {
        let x;
		ctx.fillStyle = "white";
		ctx.font = "40px Arial";
		if (playerID === 1)
			x = this.canvas.width / 4;
		else
			x = this.canvas.width * 3 / 4;
		ctx.fillText(`Score: ${this.score}`, x, 30);
    }

    scored() {
        this.score++;
    }

    displayEndgameMessage(ctx, finalScore, msg) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "50px Arial";
        ctx.textAlign = "center";
        ctx.fillText(msg, this.canvas.width / 2, this.canvas.height / 2 - 20);
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

    resetPosition() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.xspeed = -this.xspeed; // Alternate serve direction
    }

    move(player1, player2) {
        this.x += this.xspeed;
        this.y += this.yspeed;

        // Top and bottom wall collision
        if (this.y <= 0 || this.y + this.radius >= this.canvas.height) {
            this.yspeed = -this.yspeed;
        }

        // Left paddle (Player 1) collision
        if (
            this.x - this.radius <= player1.x + player1.width &&
            this.y >= player1.y &&
            this.y <= player1.y + player1.height
        ) {
            this.xspeed = -this.xspeed;
        }

        // Right paddle (Player 2) collision
        if (
            this.x + this.radius >= player2.x &&
            this.y >= player2.y &&
            this.y <= player2.y + player2.height
        ) {
            this.xspeed = -this.xspeed;
        }

        // Scoring conditions
        if (this.x - this.radius <= 0) {
            player2.scored();
            this.resetPosition();
        } else if (this.x + this.radius >= this.canvas.width) {
            player1.scored();
            this.resetPosition();
        }
    }
}