import { Ball, Player } from "./classes.js"

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas, 0);
const opponent = new Player(canvas);

const ball = new Ball(canvas);

player.draw(ctx);
opponent.draw(ctx);
ball.draw(ctx);

let gameLoopId = null;

function handleScoreUpdate(data, player, opponent, ctx, gameLoopId) {
    if (data.player === "player1") {
        player.score = data.score;
    } else {
        opponent.score = data.score;
    }

    console.log("current data score: " + data.score);
    if (data.score >= player.maxScore)
    {
        cancelAnimationFrame(gameLoopId);
        const finalScore = `${player.score} - ${opponent.score}`;

        const isLocalPlayerWinner =
            (data.player === "player1" && player.x === 0) || 
            (data.player === "player2" && player.x > 0);

        if (!isLocalPlayerWinner) {
            player.displayEndgameMessage(ctx, finalScore);
        } else {
            opponent.displayEndgameMessage(ctx, finalScore);
        }
    }
}

function handleRoleAssignment(data, player, opponent, ball, canvas) {
    if (data.role === "player1") {
        player.x = 0;
        opponent.x = canvas.width - opponent.width;
        ball.isGameMaster = true;
    } else if (data.role === "player2") {
        player.x = canvas.width - player.width;
        opponent.x = 0;
    }
}

let socket = null;

function initializeWebSocket() {
    const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    socket = new WebSocket(`ws://localhost:8001/ws/ping_pong/${roomID}/`);
    
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
        alert("Unable to connect to the server. Please check your connection or try again later.");
    };
    socket.onclose = () => {
        console.warn("WebSocket connection closed. Retrying...");
        setTimeout(() => {
            initializeWebSocket(); // Retry connection
        }, 1000);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
    
        console.log("data.type is: " + data.type);
        switch (data.type) {
            case "role":
                handleRoleAssignment(data, player, opponent, ball, canvas);
                break;
            case "paddleUpdate":
                // Update the paddle position of the opponent
                if (data.player !== player.id) {
                    opponent.update(data.position);
                }
                break;
            case "update":
                if (data.players) {
                    if (data.players.player1)
                        player.update(data.players.player1.y);
                    if (data.players.player2)
                        player.update(data.players.player2.y);
                    console.log("data.players.player1 is: " + data.players.player1);
                }
                else
                {
                    console.log("data.players.player1 is: " + data.players.player1);
                }
                break;
            case "scoreUpdate":
                handleScoreUpdate(data, player, opponent, ctx, gameLoopId);
                break;
            default:
                console.warn("Unhandled message type:", data.type);
        }
    };    
}

initializeWebSocket();

// Keydown event
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') player.up = true;
    if (e.key === 's') player.down = true;
    if (e.key === 'ArrowUp') player.up = true;
    if (e.key === 'ArrowDown') player.down = true;
});

// Keyup event
window.addEventListener('keyup', (e) => {
    if (e.key === 'w') player.up = false;
    if (e.key === 's') player.down = false;
    if (e.key === 'ArrowUp') player.up = false;
    if (e.key === 'ArrowDown') player.down = false;
});

function gameLoop() {
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.draw(ctx);
    opponent.draw(ctx);
    ball.draw(ctx);
    player.drawScore(ctx, 1);
    opponent.drawScore(ctx, 2);

    player.move(socket);
}
gameLoop();
