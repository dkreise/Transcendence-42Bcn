import { Ball, Player } from "./remoteClasses.js";
import { setupControls } from "./localGame.js"

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
	ball.x += (targetBallX - ball.x) * ballCoef;
	ball.y += (targetBallY - ball.y) * ballCoef;
}

function handleRoleAssignment(role) {
	console.log("Hi! I'm " + role);
	if (role === "player1") {
		player = new Player(canvas, "player1", backFactor["y"]);
		opponent = new Player(canvas, "player2", backFactor["y"]);
	} else if (role === "player2") {
		player = new Player(canvas, "player2", backFactor["y"]);
		opponent = new Player(canvas, "player1", backFactor["y"]);
	}
}

/*function displayStatus(wait) {
	const message = document.getElementById("gameStatus");
	message.style.display = wait ? "block" : "none";
	message.style.width = `${canvas.width}px`;
	message.style.height = `${canvas.height}px`;
	message.style.left = `${canvas.offsetLeft}px`;
	message.style.top = `${canvas.offsetTop}px`;
}*/

function displayCountdown(countdown)
{
	if (!ctx)
		return ;
	let fontSize = Math.floor(canvas.width * 0.05);
	let waitElement = document.getElementById("wait");
	let waitMsg = waitElement ? waitElement.dataset.original : "Waiting for X"; 

	console.log("displaying CountDown");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(100 100 100 / 50%)"; //rectangle style
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "rgb(255, 255, 255)"; //text style
	ctx.font = `${fontSize}px Arial`;
	ctx.textAlign = "center";
	if (opponent.whoAmI)
		waitMsg = waitMsg.replace("X", opponent.whoAmI);
	else if (player.role == "player1")
		waitMsg = waitMsg.replace("X", "player2");
	else
	waitMsg = waitMsg.replace("X", "player1");
	ctx.fillText(waitMsg, canvas.width / 2, canvas.height / 2 - fontSize);
	ctx.fillText(waitMsg, canvas.width / 2, canvas.height / 2 + fontSize);
	if (countdown)
		setTimeout(() => displayCountdown(countdown - 1), 1000);
}

function handleEndgame(data) {
	const { wait, winnerId, loserRole, scores } = data;
	const finalScore = `${scores.player1} - ${scores.player2}`;

	displayStatus(0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (loserRole == player.role)
		player.displayEndgameMessage(ctx, finalScore, endgameMsg["loser"]);
	else
		player.displayEndgameMessage(ctx, finalScore, endgameMsg["winner"]);
	cancelAnimationFrame(gameLoopId);
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
	socket.onclose = () => {
		console.warn("WebSocket connection closed. Retrying...");
		if (retries++ <= 5)
			setTimeout(initializeWebSocket, 1000);
	};

	socket.onmessage = async (event) => {
		const data = JSON.parse(event.data);
		if (Object.hasOwn(data, "wait"))
			console.log("data type: " + data.type + " data wait" + data.wait);

		switch (data.type) {
			case "role":
				backFactor["x"] = canvas.width / data.canvasX;
				backFactor["y"] = canvas.height / data.canvasY;
				handleRoleAssignment(data.role);
				break;
			case "players":
				player.whoAmI = data.me;
				opponent.whoAmI = data.you;
			case "status":
				console.log("status msg received! wait = " + data.wait)
				if (data.wait)
					displayCountdown(data.countdown);
					//displayStatus(data.wait);
				else (!data.wait)
				{
					//console.log("player: " + player + " p.role: " + player.role);
					setupControls(player, opponent)
					gameLoop();
				}
				break;
			case "update":
				if (data.wait)
					return;
				if (data.players)
				{
					let pl1 = data["players"]["player1"]["y"] * backFactor["y"];
					let pl2 = data["players"]["player2"]["y"] * backFactor["y"];
					if (player.role == "player1")
					{
						player.update(pl1, data["scores"]["player1"]);
						opponent.update(pl2, data["scores"]["player2"]);
					}
					else if (player.role == "player2") 
					{
						player.update(pl2, data["scores"]["player2"]);
						opponent.update(pl1, data["scores"]["player1"]);
					}
				}
				if (data.ball) {
					targetBallX = data.ball.x * backFactor["x"];
					targetBallY = data.ball.y * backFactor["y"];
				}
				break ;
			case "endgame":
				handleEndgame(data);
				break;
			default:
				console.warn("Unhandled message type:", data.type);
		}
	};
}

function gameLoop() {
	gameLoopId = requestAnimationFrame(gameLoop);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	player.draw(ctx);
	opponent.draw(ctx);
	player.drawScore(ctx, 1);
	opponent.drawScore(ctx, 2);
	interpolateBall();
	ball.draw(ctx);

	player.move(socket);
	ball.move(player, opponent, gameLoopId, socket);
}

export function startGame()
{
	canvas = document.getElementById('newGameCanvas');
	ctx = canvas.getContext('2d');
	ball = new Ball(canvas);
	targetBallX = ball.x;
	targetBallY = ball.y;
	initializeWebSocket();
}
