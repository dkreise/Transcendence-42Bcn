// Game state variables
let gameLoopId;

// Elements
const startButton = document.getElementById('startButton');
const gameInfo = document.getElementById('gameInfo');
const player1NameElement = document.getElementById('player1Name');
const player2NameElement = document.getElementById('player2Name');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables (reset these when restarting)
const paddleWidth = 10;
const paddleHeight = 80;
const paddleSpeed = 5;
let ballX, ballY, ballSpeedX, ballSpeedY;
let paddle1Y, paddle2Y, player1Score, player2Score;
const winningScore = 2;

// Player controls
const keys = { up: false, down: false, w: false, s: false };

function resetGameVariables() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 4;
    ballSpeedY = 4;
    paddle1Y = canvas.height / 2 - paddleHeight / 2;
    paddle2Y = canvas.height / 2 - paddleHeight / 2;
    player1Score = 0;
    player2Score = 0;
}

function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

    // Draw ball
    ctx.fillRect(ballX, ballY, 10, 10);

    // Draw scores
    ctx.font = '20px Arial';
    ctx.fillText(player1Score, canvas.width / 4, 20);
    ctx.fillText(player2Score, (canvas.width * 3) / 4, 20);
}

function moveGameElements() {
    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top and bottom walls
    if (ballY <= 0 || ballY + 10 >= canvas.height) {
        ballSpeedY *= -1;
    }

    // Ball collision with paddles
    if (
        (ballX <= paddleWidth && ballY >= paddle1Y && ballY <= paddle1Y + paddleHeight) ||
        (ballX + 10 >= canvas.width - paddleWidth &&
            ballY >= paddle2Y &&
            ballY <= paddle2Y + paddleHeight)
    ) {
        ballSpeedX *= -1;
    }

    // Scoring
    if (ballX < 0) {
        player2Score++;
        resetBall();
    }
    if (ballX > canvas.width) {
        player1Score++;
        resetBall();
    }

    // Paddle movement
    if (keys.w && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys.s && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys.up && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys.down && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;

    // Check for a winner
    if (player1Score >= winningScore || player2Score >= winningScore) {
        const winner = player1Score >= winningScore ? player1NameElement.textContent : player2NameElement.textContent;
        sendMatchData(winner);
        stopGame(winner);
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX *= -1; // Change direction
}

function gameLoop() {
    moveGameElements();
    drawGame();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
    resetGameVariables();
    gameLoop();
}

function stopGame(winner) {
    // Stop the game loop
    cancelAnimationFrame(gameLoopId);

    // Display the winner
    displayWinner(winner);
}

function displayWinner(winner) {
    // Hide the game info and start button
    gameInfo.classList.add('hidden');
    startButton.classList.add('hidden');

    // Create a huge "WON" message
    const winnerMessage = document.createElement('div');
    winnerMessage.style.fontSize = '100px';
    winnerMessage.style.color = 'white';
    winnerMessage.style.textAlign = 'center';
    winnerMessage.textContent = `${winner} WON!!!!!!!!!!!!`;

    // Append to body
    document.body.appendChild(winnerMessage);
}

async function sendMatchData(winner) {
    try {
        const data = {
            player1: player1NameElement.textContent,
            score_player1: player1Score,
            player2: player2NameElement.textContent,
            score_player2: player2Score,
            winner: winner
        };

        const response = await fetch('/api/save_score/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // For CSRF protection
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            alert('Error saving match data.');
        }
    } catch (error) {
        console.error('Error sending match data:', error);
        alert('An error occurred while saving match data.');
    }
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return '';
}

async function fetchPlayerNames() {
    try {
        const response = await fetch('/api/get_names/');
        const data = await response.json();

        if (data.name1 && data.name2) {
            player1NameElement.textContent = data.name1;
            player2NameElement.textContent = data.name2;
            startButton.classList.add('hidden');
            gameInfo.classList.remove('hidden');
            startGame();
        } else {
            alert('Failed to fetch player names.');
        }
    } catch (error) {
        console.error('Error fetching player names:', error);
        alert('An error occurred while fetching player names.');
    }
}

// Event Listeners
startButton.addEventListener('click', fetchPlayerNames);

window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});