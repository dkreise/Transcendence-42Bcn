const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas, 0);
const opponent = new Player(canvas);

const ball = new Ball(canvas);

player.draw(ctx);
opponent.draw(ctx);
ball.draw(ctx);

let socket;

function initializeWebSocket() {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.warn("WebSocket already open or not closed yet.");
        return;
    }

    const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    socket = new WebSocket(`ws://localhost:8443/ws/ping_pong/?room=${roomID}`);

    socket.onopen = function () {
        console.log("WebSocket connection established.");
    };

    socket.onerror = function (error) {
        console.error("WebSocket error:", error);
    };

    socket.onclose = function () {
        console.warn("WebSocket connection closed. Retrying...");
        setTimeout(initializeWebSocket, 1000); // Retry connection
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log("Received data:", data);

        if (data.type === "role") {
            if (data.role === "player1") {
                console.log("You are player 1.");
                player.x = 0; // Left paddle
                opponent.x = canvas.width - opponent.width; // Right paddle
            } else if (data.role === "player2") {
                console.log("You are player 2.");
                player.x = canvas.width - player.width; // Right paddle
                opponent.x = 0; // Left paddle
            }
        }

        if (data.type === "paddleMove") {
            if (data.player !== (player.x === 0 ? "player1" : "player2")) {
                opponent.update(data.position);
            }
        }
    };
}


//function initializeWebSocket() {
//    if (socket && socket.readyState !== WebSocket.CLOSED) {
//        console.warn("WebSocket already open or not closed yet.");
//        return;
//    }
//
//    const roomID = "42"; // This could be dynamic or user-defined
//    socket = new WebSocket(`ws://localhost:8443/ws/ping_pong/?room=${roomID}`);
//
//
//    socket.onopen = function () {
//        console.log("WebSocket connection established.");
//    };
//
//    socket.onerror = function (error) {
//        console.error("WebSocket error:", error);
//    };
//
//    socket.onclose = function () {
//        console.warn("WebSocket connection closed. Retrying...");
//        setTimeout(initializeWebSocket, 1000); // Retry connection
//    };
//
//    socket.onmessage = function (event) {
//        const data = JSON.parse(event.data);
//        console.log("Received data:", data);
//        if (data.type === "paddleMove") {
//            if (data.player == "player2")
//            {
//                opponent.update(data.position);
//            }
//            //if (data.player !== (player.x === 0 ? "player1" : "player2")) {
//            //    opponent.update(data.position);
//            //}
//        }
//    };
//    
//}


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

let gameLoopId = requestAnimationFrame(gameLoop);

function gameLoop()
{
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0,0, canvas.width, canvas.height);
    player.draw(ctx);
    opponent.draw(ctx);
    ball.draw(ctx);

    player.move(socket);
    ball.move(player, opponent, gameLoopId);
}

gameLoop();