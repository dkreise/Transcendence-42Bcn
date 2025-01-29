import { makeAuthenticatedRequest } from "./login.js";
import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { Ball, Player } from "./localClasses.js";

var baseUrl = "http://localhost"; // change (parse) later



// Game Initialization
let canvas = null;
let ctx = null;
let player1 = null;
let player2 = null;
let ball = null;
let gameLoopId = null;

// Game loop
function gameLocalLoop() {
    gameLoopId = requestAnimationFrame(gameLocalLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players and ball
    player1.draw(ctx);
    player2.draw(ctx);
    ball.draw(ctx);

    console.log('In local game loop!');

    // Draw scores
    player1.drawScore(ctx);
    player2.drawScore(ctx);

    // Move players and ball
    player1.move();
    player2.move();
    ball.move(player1, player2);

    // Endgame check
    if (player1.score >= 5 || player2.score >= 5) {
        const winner = player1.score > player2.score ? "Player 1 Wins!" : "Player 2 Wins!";
        const finalScore = `${player1.score} - ${player2.score}`;
        cancelAnimationFrame(gameLoopId);
        player1.displayEndgameMessage(ctx, finalScore, winner);
    }
}

// Event listeners for player controls
export function setupControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player1.up = false;
        if (e.key === "s") player1.down = false;
        if (e.key === "ArrowUp") player2.up = false;
        if (e.key === "ArrowDown") player2.down = false;
    });
}

// Start game function
export function startLocalGame(playerName1, playerName2) {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Initialize players and ball
    console.log('Starting local game...');
    console.log(`Canvas: ${canvas.width} x ${canvas.height}`);
    player1 = new Player(canvas, 0, playerName1, 0);
    player2 = new Player(canvas, 1, playerName2, canvas.width - 10);
    ball = new Ball(canvas);

    setupControls();
    gameLocalLoop();
}