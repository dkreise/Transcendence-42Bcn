const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas, 0);
const opponent = new Player(canvas);

const ball = new Ball(canvas);

player.draw(ctx);
opponent.draw(ctx);
ball.draw(ctx);

// WebSocket setup (placeholder for future multiplayer connection)
let socket;
function setupWebSocket() {
    socket = new WebSocket("ws://172.30.192.1:8000/ws/pong/");
    socket.onopen = () => console.log("Connected to WebSocket");
    socket.onmessage = (event) => handleSocketMessage(JSON.parse(event.data));
}

// Handle WebSocket messages (to be implemented for multiplayer)
function handleSocketMessage(data) {
    // Update opponent and ball positions based on remote player’s data
    if (data.type === "opponent_position") {
        opponent.y = data.position;  // Remote player's paddle position
    } else if (data.type === "ball_position") {
        ball.x = data.x;
        ball.y = data.y;
    } else if (data.type === "score_update") {
        player.score = data.player_1_score;
        opponent.score = data.player_2_score;
    }
}

// Keydown event
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') player.up = true;
    if (e.key === 's') player.down = true;
    //if (e.key === 'ArrowUp') opponent.up = true;
    //if (e.key === 'ArrowDown') opponent.down = true;
});

// Keyup event
window.addEventListener('keyup', (e) => {
    if (e.key === 'w') player.up = false;
    if (e.key === 's') player.down = false;
    //if (e.key === 'ArrowUp') opponent.up = false;
    //if (e.key === 'ArrowDown') opponent.down = false;
});

let gameLoopId = requestAnimationFrame(gameLoop);

function gameLoop()
{
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0,0, canvas.width, canvas.height);
    player.draw(ctx);
    opponent.draw(ctx);
    ball.draw(ctx);

    player.move();
    opponent.move();
    ball.move(player, opponent, gameLoopId);

    // Send player position to server if multiplayer (placeholder)
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "player_position", position: player.y }));
    }
}

gameLoop();