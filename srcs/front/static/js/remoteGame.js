import { Ball, Player } from "./remoteClasses.js";
import { setupControls } from "./localGame.js";
import { refreshAccessToken } from "./login.js";

const endgameMsg = {
	"winner": "Congratuations! You've won!\n",
	"loser": "Better luck next time :')\n"
};

let canvas, ctx = null;

const ballCoef = 0.3;
let ball, targetBallX, targetBallY = null;
let player, opponent = null;
let backFactor = {
	"x": null,
	"y": null
};

let socket = null;
let gameLoopId = null;
 
console.log("Hi! This is remoteGame.js :D");

function interpolateBall() {
	//console.log(`interpolate: ballX: ${ball.x} ball.Y: ${ball.y}`);
	ball.x += (targetBallX - ball.x) * ballCoef;
	ball.y += (targetBallY - ball.y) * ballCoef;
}

function handleRoleAssignment(role) {
	console.log("Hi! I'm " + role);
	if (role === "player1") {
		player = new Player(canvas, "player1");
		opponent = new Player(canvas, "player2");
	} else if (role === "player2") {
		player = new Player(canvas, "player2");
		opponent = new Player(canvas, "player1");
	}
	//player.setVars();
	//opponent.setVars();
	//ball.setVars();
}

function scaleGame(data)
{
	player.width = canvas.width * (data.padW / data.canvasX);
	opponent.width = player.width;
	player.height = canvas.height * (data.padH / data.canvasY);
	opponent.height = player.height;
	if (player.x != 0)
		player.x = canvas.width - player.width;
	else
		opponent.x = canvas.width - opponent.width;
}

async function readySteadyGo(countdown)
{
	const msg = ["1", "2", "3"];
	let div = document.getElementById("wait");

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	div.textContent = msg[countdown];
	div.style.fontSize = Math.floor(canvas.width * 0.25) + "px";

	ctx.fillStyle = "rgb(0 0 0 / 25%)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	div.style.display = "block";
	//console.log(`[${getTimestamp()}] RSG: ${countdown}`);
	if (countdown >= 0)
		await setTimeout(async() => await readySteadyGo(--countdown), 500);
	else
		div.style.display = "none";
}

function displayCountdown()
{
	if (!ctx)
		return ;
	let fontSize = Math.floor(canvas.width * 0.05);
	let div = document.getElementById("wait");
	let waitMsg = div ? div.dataset.original : "Waiting for X"; 

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(0 0 0 / 25%)"; //rectangle style
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if (opponent && opponent.whoAmI)
		waitMsg = waitMsg.replace("X", opponent.whoAmI);
	else if (player.role == "player1")
		waitMsg = waitMsg.replace("X", "player2");
	else
		waitMsg = waitMsg.replace("X", "player1");
	div.textContent = waitMsg;
	div.style.fontSize = Math.floor(canvas.width * 0.05) + "px";
}

function handleEndgame(data) {
	const { winner, loser } = data;
	
	console.log(`winner ${winner} loser ${loser}`);
	console.log(`player's score: ${player.score}\nopponent's score ${opponent.score}`);
	if (gameLoopId)
		cancelAnimationFrame(gameLoopId);
	if (player.whoAmI == winner)
	{
		player.scores++;
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["winner"]);
	}
	else
	{
		opponent.scores++;
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["loser"]);
	}
}

function getTimestamp() {
	const date = new Date();

	return `${date.getDate()}-${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

//async function initializeWebSocket(roomId) {
async function initializeWebSocket() {
	//const roomID = new URLSearchParams(window.location.search).get("room") || "default";
	const roomId = 123;
	let retries = 0;

	const token = localStorage.getItem("access_token");
	if (!token)
	{
		console.warn("No access token found");
		return ;
	}
	if (!socket)
	{
		socket = new WebSocket(`ws://localhost:8001/ws/G/${roomId}/?token=${token}`);
		console.log("Socket created!");
	}
	socket.onopen = () => console.log("WebSocket connection established.");
	socket.onerror = (error) => {
		console.error("WebSocket encountered an error:", error);
		alert("Unable to connect to the server. Please check your connection.");
	};
	socket.onclose = async (event) => {
		console.log("WebSocket connection closed. Retrying...");
		if (event.code === 4001) {
			// Token expired; refresh token logic
			try {
				await refreshAccessToken();
			  // Reconnect with the new token
				initializeWebSocket();
			} catch (err) {
			  console.error("Failed to refresh token", err);
			  handleLogout();
			}
		} else if (retries++ <= 5)
			setTimeout(initializeWebSocket, 1000);
	};

	socket.onmessage = async (event) => {
		const data = JSON.parse(event.data);

		console.log(`data type is: ${data.type}`);
		switch (data.type) {
			case "role":
				handleRoleAssignment(data.role);
				scaleGame(data);
				break;
			case "players":
				player.whoAmI = data[player.role];
				opponent.whoAmI = data[opponent.role];
				socket.send(JSON.stringify({"type": "ready"}))
				break;
			case "status":
				//console.log(`player1: ${data.players.player1.id} scores: ${data.scores.player1}`);
				if (data.wait) // data.wait [bool]
				{
					if (gameLoopId)
						cancelAnimationFrame(gameLoopId);
					if (data.countdown == 0)
						displayCountdown();
					else
					{
						await readySteadyGo(data.countdown - 1);
						player.update(data.players, data.scores);
						opponent.update(data.players, data.scores);
						ball.resetPosition();
					}
				}
				else
				{
					setupControls(player, opponent)
					gameLoop();
				}
				break;
			case "update":
				if (data.players)
				{
					player.update(data.players, data.scores);
					opponent.update(data.players, data.scores);
				}
				if (data.ball) {
					targetBallX = data.ball.x * canvas.width;
					targetBallY = data.ball.y * canvas.height;
				}
				break ;
			case "reject":
				alert(`Connection rejected: ${data.reason}`);
				socket.close();
				break ;
			case "endgame":
				console.log("This game's over!");
				handleEndgame(data);
				break ;
			default:
				console.warn("Unhandled message type:", data.type);
		}
	};
}

function gameLoop() {
	gameLoopId = requestAnimationFrame(gameLoop);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(0 0 0 / 75%)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	player.draw(ctx);
	opponent.draw(ctx);
	player.drawScore(ctx);
	opponent.drawScore(ctx);
	interpolateBall();
	ball.draw(ctx);

	player.move(socket);
}

function resizeCanvas() {
    canvas = document.getElementById("newGameCanvas");
    const container = document.getElementById("newGameBoard");
	if (!canvas || !container)
	{
		alert("Unable to display the game. Please, try again later");
		return ;
	}

    let maxWidth = container.clientWidth;
    let maxHeight = container.clientHeight;

    let newWidth = maxWidth;
    let newHeight = (4 / 6) * newWidth;

	//Apply aspect ratio
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (6 / 4) * newHeight;
	}

    newWidth = Math.floor(newWidth);
    newHeight = Math.floor(newHeight);

    canvas.width = newWidth;
    canvas.height = newHeight;

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
	ctx = canvas.getContext('2d');
	if (player)
		player.resize(canvas);
	if (opponent)
		opponent.resize(canvas);
	if (ball)
		ball.resize(canvas);

    console.log(`Canvas resized: ${newWidth} x ${newHeight}`);
}

// Resize canvas when the window resizes
window.addEventListener("resize", resizeCanvas);

export function startGame()
{
    canvas = document.getElementById("newGameCanvas");
	if (!canvas)
	{
		alert("Unable to display the game. Please, try again later");
		return ;
	}
	ball = new Ball(canvas);
	resizeCanvas();
	targetBallX = ball.x;
	targetBallY = ball.y;
	initializeWebSocket();
}
