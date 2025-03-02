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
		player = new Player(canvas, "player1");
		opponent = new Player(canvas, "player2");
	} else if (role === "player2") {
		player = new Player(canvas, "player2");
		opponent = new Player(canvas, "player1");
	}
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
	//console.log("FRONT 2 width: " + player.width + " height: " + player.height);
	backFactor["x"] = canvas.width / data.canvasX;
	backFactor["y"] = canvas.height / data.canvasY;
	player.backFactor = backFactor["y"];
	opponent.backFactor = backFactor["y"];
}

async function readySteadyGo(countdown)
{
	const msg = ["1", "2", "3"];
	let div = document.getElementById("wait");

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	div.textContent = msg[countdown];
	div.style.fontSize = Math.floor(canvas.width * 0.25) + "px";

	ctx.fillStyle = "rgb(100 100 100 / 50%)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	div.style.display = "block";
//	ctx.fillStyle = "rgb(255, 255, 255)"; //text style
//	ctx.font = `${fontSize}px Arial`;
//	ctx.textAlign = "center";
//	ctx.fillText(msg[countdown], canvas.width / 2, canvas.height / 2 + fontSize / 2);
	console.log(`[${getTimestamp()}] RSG: ${countdown}`);
	if (countdown)
		await setTimeout(async() => await readySteadyGo(--countdown), 1000);
	else
		div.style.display = "none";
}

function displayCountdown()
{
	if (!ctx)
		return ;
	let fontSize = Math.floor(canvas.width * 0.05);
	let waitElement = document.getElementById("wait");
	let waitMsg = waitElement ? waitElement.dataset.original : "Waiting for X"; 

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
	//ctx.fillText(waitMsg, canvas.width / 2, canvas.height / 2 - fontSize);
	ctx.fillText(waitMsg, canvas.width / 2, canvas.height / 2 + fontSize / 2);
}

function handleEndgame(data) {
	const { wait, winnerId, loserRole } = data;
	
	if (player.whoAmI == winnerId)
		player.scores++;
	else
		opponent.scores++;
	if (loserRole == player.role)
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["loser"]);
	else
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["winner"]);
	cancelAnimationFrame(gameLoopId);
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
	socket.onclose = (event) => {
		console.log(`WebSocket connection closed with code ${event.code}`);
		//console.log(`WS: closing reason ${event.reason}`);
		//if (event.code >= 4000 && event.code < 4005)
		//	alert(event.reason);
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
				console.log(`player1: ${data.players.player1.id} scores: ${data.scores.player1}`);
				player.update(data.players, data.scores);
				opponent.update(data.players, data.scores);
				if (data.wait) // data.wait [bool]
				{
					if (gameLoopId)
						cancelAnimationFrame(gameLoopId);
					if (data.countdown != 4)
						displayCountdown();
					else
						await readySteadyGo(data.countdown - 2);
				}
				else
				{
					console.log("let's start the game!");
					console.log(`canvas W: ${canvas. width} H: ${canvas.height}`);
					console.log(`paddle me: ${player. width} you: ${opponent.width}`);
					console.log(`x: ${player.x} y: ${player.y}\nx: ${opponent.x} y: ${opponent.y}`);
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
					targetBallX = data.ball.x * backFactor["x"];
					targetBallY = data.ball.y * backFactor["y"];
				}
				break ;
			case "reject":
				alert(`Connection rejected: ${data.reason}`);
				socket.close();
				break ;
			case "endgame":
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
	//ball.move(player, opponent, gameLoopId, socket);
}

window.addEventListener("resize", () => {
	if (!player || !player.canvas) return ;
	console.log("player canvas width: " + player.canvas.width);
	console.log("actual canvas width: " + canvas.width);
});

export function startGame()
{
	canvas = document.getElementById('newGameCanvas');
	if (!canvas)
	{
		alert("Unable to display the game. Please, try again later");
		return ;
	}
	ctx = canvas.getContext('2d');
	ball = new Ball(canvas);
	targetBallX = ball.x;
	targetBallY = ball.y;
	initializeWebSocket();
}
