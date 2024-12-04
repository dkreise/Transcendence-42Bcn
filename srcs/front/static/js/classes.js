export class Player {
    width = 10;
    height = 80;
    maxScore = 5;

    constructor(canvas, initPos=(canvas.width - this.width)) {
        this.x = initPos;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 5;
        this.color = "white";
        this.up = false;
        this.down = false;
        this.score = 0;
        this.canvas = canvas;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    move(socket) {
        if (this.up && this.y > 0)
            this.y -= this.speed;
        if (this.down && this.y < this.canvas.height - this.height)
            this.y += this.speed;
        if (this.up || this.down) {
            const data = {
                "type": "paddleMove",
                "position": this.y,
                "player": this.x === 0 ? "player1" : "player2", // Identify which player is sending the data
                "score": this.score
            };
            if (socket.readyState === WebSocket.OPEN) {
                //console.log("Sending paddleMove:", data);
                socket.send(JSON.stringify(data));
            } else {
                console.warn("WebSocket not open, cannot send data. ReadyState:", socket.readyState);
            }
        }
    }
    
    scored(socket) {
        this.score++;
        const data = {
            type: "scoreUpdate",
            player: this.x === 0 ? "player1" : "player2", // Indicate who scored
            score: this.score, // Send the updated score
        };
        console.log(data.player + " has scored");
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data)); // Broadcast the score update
        }
    }
    
    update(newY) {
        this.y = newY;
    }

    drawScore(ctx, playerID)
    {
        let x;
        ctx.fillStyle = "white";
        ctx.font = "40px Calibri";
        if (playerID == 1)
            x = this.canvas.width / 4;
        else
            x = this.canvas.width * 3 / 4;
        ctx.fillText(`Score: ${this.score}`, x, 30);
    }

    displayEndgameMessage(ctx, finalScore) {
        // Determine if this player has won or lost
        const message =
            this.score === this.maxScore
                ? "Congratulations! You've won!"
                : "Better luck next time!";
    
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
        // Display the message
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
        this.xspeed = 10.0;
        this.yspeed = 10.0;
        this.color = "white";
        this.canvas = canvas;
        this.isGameMaster = false;
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
        this.xspeed = -this.xspeed;
    }
    move(player, opponent, socket) {
        if (!this.isGameMaster)
            return ;
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
            opponent.scored(socket);
            this.resetPosition();
        }
        else if (this.x + this.radius >= this.canvas.width)
        {
            player.scored(socket);
            this.resetPosition();
        }
        const data = { type: "ballPosition", xpos: this.x, ypos: this.y };
        if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(data));
        
    }
    update(newX, newY)
    {
        this.x = newX;
        this.y = newY;
    }
}