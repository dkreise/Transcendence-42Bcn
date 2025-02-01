import { Ball, Player } from "./localClasses.js";

// Game Initialization
let canvas = null;
let ctx = null;
let player = null;
let AI = null;
let mainUser = null; // if the main user is player 1 or 2
let ball = null;
let gameLoopId = null;
let maxScore = 2;
let intervalID = null;
let targetY = null;

// if mainUser == 1, we need to focus on right wall, else -- on left wall
// ball.xspeed > 0 -- right, < 0 -- left
// ball.yspeed > 0 -- down, < 0 -- up
function predictBallY() {
    let tempX = ball.x;
    let tempY = ball.y;
    let tempXspeed = ball.xspeed;
    let tempYspeed = ball.yspeed;

    if (tempXspeed > 0 && mainUser == 2)
        return null;
    if (tempXspeed < 0 && mainUser == 1)
        return null;

    // when the ball will hit the top or bottom walls
    let timeToTopBottom = (tempYspeed > 0) 
        ? (canvas.height - (tempY + ball.radius)) / tempYspeed  // bottom wall
        : -(tempY - ball.radius) / tempYspeed;                  // top wall

    // when the ball will hit the left or right walls
    let timeToLeftRight = (tempXspeed > 0) 
        ? (canvas.width - (tempX + ball.radius)) / tempXspeed   // right wall
        : -(tempX - ball.radius) / tempXspeed;                  // left wall

    while (timeToTopBottom < timeToLeftRight) {
    // for (let i = 0; i < 3; i++) {
        console.log('IN THE LOOOOOOPP');
        tempX = tempX + tempXspeed * timeToTopBottom;
        if (tempYspeed < 0) {
            tempY = 0;//ball.radius;
        } else {
            tempY = canvas.height - ball.radius;
        }
        tempYspeed = -tempYspeed;

        timeToTopBottom = (tempYspeed > 0) 
        ? (canvas.height - (tempY + ball.radius)) / tempYspeed  // bottom wall
        : -(tempY - ball.radius) / tempYspeed;                  // top wall

        timeToLeftRight = (tempXspeed > 0) 
            ? (canvas.width - (tempX + ball.radius)) / tempXspeed   // right wall
            : -(tempX - ball.radius) / tempXspeed;  
        
        // if (timeToTopBottom > timeToLeftRight)
        //     break;
    }

    tempY = tempY + tempYspeed * timeToLeftRight;
    console.log('ESTIMATED Y:');
    console.log(tempY);
    return tempY;
}

function doMovesAI() {
    if (!AI || !ball)
        return;

    console.log("doing it each sec");
    targetY = predictBallY();
    if (targetY === null)   
        return;

    if (targetY  < AI.y + AI.height / 2) {
        AI.up = true;
        AI.down = false;
    } else if (targetY  > AI.y + AI.height / 2) {
        AI.down = true;
        AI.up = false;
    } else {
        AI.up = false;
        AI.down = false;
    }
}

function checkIfAIneedStop() {
    if (targetY) {
        if (AI.up && AI.y + (AI.height / 2) <= targetY) {
            AI.up = false;
        } else if (AI.down && AI.y + (AI.height / 2) >= targetY) {
            AI.down = false;
        }
    }
}

// Game loop
function gameAILoop() {
    gameLoopId = requestAnimationFrame(gameAILoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players and ball
    player.draw(ctx);
    AI.draw(ctx);
    ball.draw(ctx);

    // Draw scores
    player.drawScore(ctx);
    AI.drawScore(ctx);

    // Move players and ball
    player.move();
    AI.move();
    checkIfAIneedStop();
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

        if (intervalID) {
            clearInterval(intervalID);
            intervalID = null;
        }
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
    if (intervalID) {
        clearInterval(intervalID);
        intervalID = null;
    }
    canvas = document.getElementById("newGameCanvas");
    ctx = canvas.getContext("2d");
    console.log(mainUserNmb);
    console.log(playerName1);
    console.log(playerName2)

    canvas.width = window.innerWidth * 0.65; // % of screen width
    canvas.height = canvas.width * 0.57; // % of screen height

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
    console.log(canvas.width);
    console.log(canvas.height);

    setupControlsAI();
    intervalID = setInterval(doMovesAI, 1000);
    gameAILoop();
}