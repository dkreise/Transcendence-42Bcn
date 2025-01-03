import { Ball, Player } from "./classes.js";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ball = new Ball(canvas);
let whoAmI = 0;
let gameLoopId = null;
let targetBallX = ball.x, targetBallY = ball.y;
let socket = null;

let player = null;
let opponent = null;

let wait = 1;

function interpolateBall() {
    ball.x += (targetBallX - ball.x) * 0.1;
    ball.y += (targetBallY - ball.y) * 0.1;
}

function handleScoreUpdate(data) {
    const { player: scoringPlayer, score } = data;
    if (scoringPlayer === "player1") player.score = score;
    else opponent.score = score;

    if (score >= player.maxScore) {
        cancelAnimationFrame(gameLoopId);
        const finalScore = `${player.score} - ${opponent.score}`;
        const isWinner = (scoringPlayer === "player1" && player.x === 0) || 
                         (scoringPlayer === "player2" && player.x > 0);

        const displayMessage = isWinner ? player.displayEndgameMessage : opponent.displayEndgameMessage;
        displayMessage(ctx, finalScore);
    }
}

function handleRoleAssignment(role) {
    if (role === "player1") {
        whoAmI = 1;
        player = new Player(canvas, 0);
        opponent = new Player(canvas);
    } else if (role === "player2") {
        whoAmI = 2;
        opponent = new Player(canvas);
        player = new Player(canvas, 0);
    }
}

function displayStatus(wait) {
    const message = document.getElementById("gameStatus");
    message.style.display = wait ? "block" : "none";
    message.style.width = `${canvas.width}px`;
    message.style.height = `${canvas.height}px`;
    message.style.left = `${canvas.offsetLeft}px`;
    message.style.top = `${canvas.offsetTop}px`;
}

function initializeWebSocket() {
    const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    socket = new WebSocket(`ws://localhost:8001/ws/ping_pong/${roomID}/`);

    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
        alert("Unable to connect to the server. Please check your connection.");
    };
    socket.onclose = () => {
        console.warn("WebSocket connection closed. Retrying...");
        setTimeout(initializeWebSocket, 1000);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type !== "update")
			console.log("data.type:", data.type);
		if (data.hasOwnProperty("wait"))
			wait = data.wait;

        switch (data.type) {
            case "status":
                displayStatus(data.wait);
                if (!data.wait && !gameLoopId)
					gameLoop();
                break;
            case "role":
                handleRoleAssignment(data.role);
                break;
            case "update":
                if (data.wait)
					return;
                if (data.players)
				{
                    if (whoAmI === 1)
					{
                        player.update(data.players.player1.y);
                        opponent.update(data.players.player2.y);
                    }
					else if (whoAmI === 2)
					{
                        opponent.update(data.players.player1.y);
                        player.update(data.players.player2.y);
                    }
                }
                if (data.ball) {
                    targetBallX = data.ball.x;
                    targetBallY = data.ball.y;
                }
                break;
            case "scoreUpdate":
                handleScoreUpdate(data);
                break;
            default:
                console.warn("Unhandled message type:", data.type);
        }
    };
}

function gameLoop() {
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.draw(ctx);
    opponent.draw(ctx);
    interpolateBall();
    ball.draw(ctx);

    player.move(socket);
    ball.move(player, opponent, gameLoopId, socket);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') player.up = true;
    if (e.key === 's' || e.key === 'ArrowDown') player.down = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') player.up = false;
    if (e.key === 's' || e.key === 'ArrowDown') player.down = false;
});

initializeWebSocket();
