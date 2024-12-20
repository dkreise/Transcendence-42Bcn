import {
    handleBallPosition,
    handlePaddleMove,
    handleRoleAssignment,
    handleScoreUpdate,
} from "./handlers.js"

import { Ball, Player } from "./classes.js"

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas, 0);
const opponent = new Player(canvas);

const ball = new Ball(canvas);

player.draw(ctx);
opponent.draw(ctx);
ball.draw(ctx);

let socket = null;
let gameLoopId = null;

function initializeWebSocket() {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.warn("WebSocket already open or not closed yet.");
        return;
    }

    const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    socket = new WebSocket(`ws://localhost:8443/ws/ping_pong/${roomID}/`);
    console.log("roomID: " + roomID);

    socket.onopen = function () {
        console.log("WebSocket connection established.");
        if (!gameLoopId) {
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    };

    socket.onerror = function (error) {
        console.error("WebSocket error:", error);
    };

    socket.onclose = function () {
        console.warn("WebSocket connection closed.");
        setTimeout(initializeWebSocket, 1000); // Retry connection
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
    
        switch (data.type) {
            case "role":
                console.log("you're: " + data.role);
                handleRoleAssignment(data, player, opponent, ball, canvas);
                break;
            case "paddleMove":
                handlePaddleMove(data, player, opponent);
                break;
            case "ballPosition":
                handleBallPosition(data, ball);
                break;
            case "scoreUpdate":
                handleScoreUpdate(data, player, opponent, ctx, gameLoopId);
                break;
            default:
                console.warn(`Unhandled message type: ${data.type}`);
        }
    };
    
}

initializeWebSocket();

function sendPlayerAction(action) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(action));
    } else {
        console.warn("WebSocket is not open. Cannot send:", action);
    }
}

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

function gameLoop()
{
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0,0, canvas.width, canvas.height);

    player.draw(ctx);
    opponent.draw(ctx);
    ball.draw(ctx);
    player.drawScore(ctx, 1);
    opponent.drawScore(ctx, 2);

    player.move(socket);
    ball.move(player, opponent, socket);
}

gameLoop();