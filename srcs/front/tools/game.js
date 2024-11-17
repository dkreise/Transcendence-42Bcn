const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const socket = new WebSocket('ws://' + window.location.host + '/ws/match/');


// Game variables
let playerPaddleY = canvas.height / 2 - 50;
let opponentPaddleY = canvas.height / 2 - 50;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;

// WebSocket connection for game state sync
/*socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // Update the opponent paddle or ball position based on received data
    if (data.type === 'position') {
        opponentPaddleY = data.paddleY;
        ballX = data.ballX;
        ballY = data.ballY;
    }
};
*/
function gameLoop() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player paddle
    context.fillRect(10, playerPaddleY, 10, 100);

    // Draw opponent paddle
    context.fillRect(canvas.width - 20, opponentPaddleY, 10, 100);

    // Draw ball
    context.beginPath();
    context.arc(ballX, ballY, 10, 0, Math.PI * 2);
    context.fill();

    // Game logic here...
    requestAnimationFrame(gameLoop);
}

gameLoop();
