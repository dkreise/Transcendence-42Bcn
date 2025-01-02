import { Ball, Player } from "./classes.js"

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

//const player = new Player(canvas, 0);
//const opponent = new Player(canvas);

const ball = new Ball(canvas);

//player.draw(ctx, 0);
//opponent.draw(ctx);
ball.draw(ctx);

let	whoAmI = 0;
let gameLoopId = null;
let targetBallX = ball.x, targetBallY = ball.y;
let socket = null;

let player = null;
let opponent = null;

function interpolateBall() {
    ball.x += (targetBallX - ball.x) * 0.1;  // Smooth interpolation factor
    ball.y += (targetBallY - ball.y) * 0.1;
}

function handleScoreUpdate(data, player, opponent, ctx, gameLoopId) {
    if (data.player === "player1")
        player.score = data.score;
    else
		opponent.score = data.score;

    console.log("current data score: " + data.score);
    if (data.score >= player.maxScore)
    {
        cancelAnimationFrame(gameLoopId);
        const finalScore = `${player.score} - ${opponent.score}`;

        const isLocalPlayerWinner =
            (data.player === "player1" && player.x === 0) || 
            (data.player === "player2" && player.x > 0);

        if (!isLocalPlayerWinner)
            player.displayEndgameMessage(ctx, finalScore);
        else
            opponent.displayEndgameMessage(ctx, finalScore);
    }
}

function handleRoleAssignment(data)
{
	console.log("data.role is: " + data.role);
    if (data.role === "player1")
	{
		whoAmI = 1;
		player = new Player(canvas, 0);
	}
	else if (data.role === "player2")
	{
		whoAmI = 2;
		opponent = new Player(canvas);
	}
}

function displayStatus(wait)
{
	const message = document.getElementById("gameStatus");

	console.log("wait: " + wait);

	if (wait)
		message.style.display = "block";
	else
		message.style.display = "none";
}

function initializeWebSocket()
{
    const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    socket = new WebSocket(`ws://localhost:8001/ws/ping_pong/${roomID}/`);
    
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
        alert("Unable to connect to the server. Please check your connection or try again later.");
    };
    socket.onclose = () => {
        console.warn("WebSocket connection closed. Retrying...");
        setTimeout(() => {
            initializeWebSocket(); // Retry connection
        }, 1000);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
    
        console.log("data.type is: " + data.type);
		//console.log(data.ball);
        switch (data.type)
		{
			case "status":
				displayStatus(data.wait);
				break ;
            case "role":
                handleRoleAssignment(data);
                break;
            case "update":
				if (data.wait)
					return ;
				//	displayStatus(data.wait);
                if (data.players && data.players.player1 && data.players.player2)
				{
                    if (whoAmI == 1)
					{
                        player.update(data.players.player1.y);
						opponent.update(data.players.player2.y);
					}
                    if (whoAmI == 2)
					{
                        opponent.update(data.players.player1.y);
                        player.update(data.players.player2.y);
					}
                }
				if (data.ball)
				{
					targetBallX = data.ball.x;
        			targetBallY = data.ball.y;
				}
				//	ball.update(data.ball.x, data.ball.y);
                break;
            case "scoreUpdate":
                handleScoreUpdate(data, player, opponent, ctx, gameLoopId);
                break;
            default:
                console.warn("Unhandled message type:", data.type);
        }
    };    
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

document.addEventListener('keydown', (e) => {
	if (!player || !opponent)
		e.preventDefault();
});

document.addEventListener('keyup', (e) => {
	if (!player || !opponent)
		e.preventDefault();
});

function gameLoop() {
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.draw(ctx);
    opponent.draw(ctx);
	interpolateBall();
    ball.draw(ctx);
    //player.drawScore(ctx, 1);
    //opponent.drawScore(ctx, 2);

    player.move(socket);
	ball.move(player, opponent, gameLoopId);
}

initializeWebSocket();
gameLoop();
