class Player {
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
    //move(socket) {
    //    if (this.up && this.y > 0)
    //        this.y -= this.speed;
    //    if (this.down && this.y < this.canvas.height - this.height)
    //        this.y += this.speed;
    //    if (this.up || this.down) {
    //        const data = { "type": "paddleMove", "position": this.y };
    //        if (socket.readyState === WebSocket.OPEN) {
    //            console.log("Sending paddleMove:", data);
    //            socket.send(JSON.stringify(data));
    //        } else {
    //            console.error("Cannot send data. WebSocket is not open:", socket.readyState);
    //        }
    //    }
    //}
    move(socket) {
        if (this.up && this.y > 0)
            this.y -= this.speed;
        if (this.down && this.y < this.canvas.height - this.height)
            this.y += this.speed;
        if (this.up || this.down) {
            const data = {
                "type": "paddleMove",
                "position": this.y,
                "player": this.x === 0 ? "player1" : "player2" // Identify which player is sending the data
            };
            if (socket.readyState === WebSocket.OPEN) {
                console.log("Sending paddleMove:", data);
                socket.send(JSON.stringify(data));
            } else {
                console.error("Cannot send data. WebSocket is not open:", socket.readyState);
            }
        }
    }
    
    scored(loopID) {
        this.score++;
        if (this.score == this.maxScore)
        {
            cancelAnimationFrame(loopID);
            alert("This is endgame");
        }
    }
    update(newY) {
        this.y = newY;
    }
}

class Ball {
    radius = 10;

    constructor(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.xspeed = 3.0;
        this.yspeed = 3.0;
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
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.xspeed = -this.xspeed;
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
        if (this.x <= 0) {
            opponent.scored(loopID);
            this.resetPosition();
        }
        else if (this.x + this.radius >= this.canvas.width) {
            player.scored(loopID);
            this.resetPosition();
        }
        //const data = {type: "ballPosition", xpos: this.x, ypos: this.y};
        //socket.send(JSON.stringify(data));
    }
}