import { makeAuthenticatedRequest } from "./login.js";
// import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { Ball, Player } from "./localClasses.js";

var baseUrl = "http://localhost"; // change (parse) later

// Game Initialization
let canvas = null;
let ctx = null;
let player = null;
let AI = null;
let mainUser = null; // if the main user is player 1 or 2
let ball = null;
let gameLoopId = null;
let maxScore = 2;

function doMovesAI() {
    if (!AI.down && AI.y > 0) {
        AI.up = true;
    }
    if (AI.y <= 0) {
        AI.up = false;
    }
    if (!AI.up && AI.y < AI.canvas.height - AI.height) {
        AI.down = true;
    }
    if (AI.y >= AI.canvas.height - AI.height) {
        AI.down = false;
    }
    console.log(AI.y);
}

// Game loop
function gameAILoop() {
    gameLoopId = requestAnimationFrame(gameAILoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players and ball
    player.draw(ctx);
    AI.draw(ctx);
    ball.draw(ctx);

    // console.log('In AI game loop!');

    // Draw scores
    player.drawScore(ctx);
    AI.drawScore(ctx);

    // Move players and ball
    player.move();
    doMovesAI();
    AI.move();
    if (mainUser == 1) {
        ball.move(player, AI);
    } else {
        ball.move(AI, player);
    }
    

    // Endgame check
    if (player.score >= maxScore || AI.score >= maxScore) {
        const winner = player.score > AI.score ? `${player.name} Wins!` : `${AI.name} Wins!`;
        // const finalScore = `${player.score} - ${AI.score}`; // change properly
        const finalScore = `*final score*`
        cancelAnimationFrame(gameLoopId);
        player.displayEndgameMessage(ctx, finalScore, winner);
        // saveScore();
    }
}

// Event listeners for player controls
function setupControlsAI() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player.up = true;
        if (e.key === "s") player.down = true;
        if (e.key === "ArrowUp") player.up = true;
        if (e.key === "ArrowDown") player.down = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player.up = false;
        if (e.key === "s") player.down = false;
        if (e.key === "ArrowUp") player.up = false;
        if (e.key === "ArrowDown") player.down = false;
    });
}

// Start game function
export function startAIGame(playerName1, playerName2, mainUserNmb) {
    canvas = document.getElementById("newGameCanvas");
    ctx = canvas.getContext("2d");
    console.log(mainUserNmb);
    console.log(playerName1);
    console.log(playerName2)

    canvas.width = window.innerWidth * 0.65; // % of screen width
    canvas.height = canvas.width * 0.5; // % of screen height

    mainUser = mainUserNmb;

    // Initialize players and ball
    console.log('Starting AI game...');
    if (mainUserNmb == 1) {
        player = new Player(canvas, 0, playerName1, 0);
        AI = new Player(canvas, 1, playerName2, canvas.width - 10);
    } else {
        player = new Player(canvas, 1, playerName2, canvas.width - 10);
        AI = new Player(canvas, 0, playerName1, 0);
    }
    ball = new Ball(canvas);

    setupControlsAI();
    gameAILoop();
}