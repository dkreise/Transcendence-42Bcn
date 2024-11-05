// Game Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Paddle properties
const paddleWidth = 10;
const paddleHeight = 80;
const paddleSpeed = 5;

// Ball properties
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
const ballSize = 10;
let ballSpeedX = 4;
let ballSpeedY = 4;

// Player paddles
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;

// Score variables
let player1Score = 0;
let player2Score = 0;
const winningScore = 5; // Set a winning score

// Player controls
const keys = {
    up: false,
    down: false,
    w: false,
    s: false
};

// Draw paddles
function drawPaddle(x, y) {
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

// Draw ball
function drawBall() {
    ctx.fillStyle = 'white';
    ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

// Draw scores
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(player1Score, canvas.width / 4, 30);
    ctx.fillText(player2Score, (canvas.width * 3) / 4, 30);
}

// Handle paddle movement
function movePaddles() {
    if (keys.w && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys.s && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys.up && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys.down && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;
}

// Handle ball movement and scoring
function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Top and bottom wall collision
    if (ballY <= 0 || ballY + ballSize >= canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    // Left paddle collision
    if (ballX <= paddleWidth &&
        ballY + ballSize >= paddle1Y &&
        ballY <= paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
    }

    // Right paddle collision
    if (ballX + ballSize >= canvas.width - paddleWidth &&
        ballY + ballSize >= paddle2Y &&
        ballY <= paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
    }

    // Scoring
    if (ballX <= 0) {
        player2Score++;
        checkForWin();
        resetBall();
    }
    if (ballX + ballSize >= canvas.width) {
        player1Score++;
        checkForWin();
        resetBall();
    }
}

// Check for winning score
function checkForWin() {
    if (player1Score >= winningScore) {
        alert('Player 1 wins!');
        // sendMatchData('Player 1', player1Score, player2Score); // Uncomment for backend API
        stopGame();
    } else if (player2Score >= winningScore) {
        alert('Player 2 wins!');
        // sendMatchData('Player 2', player1Score, player2Score); // Uncomment for backend API
        stopGame();
    }
}

// Reset the ball to the center
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX; // Change direction
}

// Stop the game
function stopGame() {
    // No more game loop
    cancelAnimationFrame(gameLoopId);
}

// Keydown event
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
});

// Keyup event
window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});

// Main game loop
let gameLoopId; // Store the ID of the animation frame
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles, ball, and scores
    drawPaddle(0, paddle1Y);
    drawPaddle(canvas.width - paddleWidth, paddle2Y);
    drawBall();
    drawScore();

    // Move paddles and ball
    movePaddles();
    moveBall();

    // Loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();