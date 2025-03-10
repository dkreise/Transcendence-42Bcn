import { Ball, Player } from "./remoteClasses.js";
import { setupControls } from "./localGame.js";
import { setupControlsAI } from "./AIGame.js"
import { refreshAccessToken } from "./login.js";
import { startTournamentGame, stopTournamentGame } from "./tournament.js";

const gamePort = window.env.GAME_PORT;
const host = window.env.HOST;
const protocolSocket = window.env.PROTOCOL_SOCKET;

const endgameMsg = {
	"winner": "Congratuations! You've won!\n",
	"loser": "Better luck next time :')\n"
};

let canvas, ctx = null;

let ball, targetBallX, targetBallY = null;
let player, opponent = null;

let socket = null;
let gameLoopId = null;
let gameStop = false;
let tourId = null;
 
// console.log("Hi! This is remoteGame.js :D");


export function handleRoleAssignment(data) {
	console.log("Hi! I'm " + data.role);
	if (data.role === "player1") {
		console.log("Hi! I'm " + data.role + " and I'm a player");
		player = new Player(data, canvas, "player1");
		opponent = new Player(data, canvas, "player2");
	}
	else {
		console.log("Hi! I'm " + data.role + " and I'm a player");
		player = new Player(data, canvas, "player2");
		opponent = new Player(data, canvas, "player1");
	}

}

export function scaleGame(data)
{
	handleRoleAssignment(data)
	
	// player.width = canvas.width * (data.padW / data.canvasX);
	// opponent.width = player.width;
	// player.height = canvas.height * (data.padH / data.canvasY);
	// opponent.height = player.height;
	// if (player.x != 0)
	// 	player.x = canvas.width - player.width;
	// else
	// 	opponent.x = canvas.width - opponent.width;
	// player.setVars(data);
	// opponent.setVars(data);
	ball.setVars(data);
}

async function firstCountdown(callback) {
    let countdown = 2;

	const msg = ["1", "2", "3"];
	let div = document.getElementById("wait");
	player.y = 0.5;
	opponent.y = 0.5;
    const interval = setInterval(() => {    

        if (countdown < 0) {
            clearInterval(interval);
			div.textContent = "";
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
            console.log("RESUME")
            // handleOnlineEndgame();
            callback(); // Resume the game  
        } else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			div.textContent = msg[countdown];
			div.style.fontSize = Math.floor(canvas.width * 0.25) + "px";
	
	
			ctx.fillStyle = "rgb(0 0 0 / 25%)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			div.style.display = "block";
        }
        countdown--;
    }, 500);
}

async function readySteadyGo(countdown)
{
	// if (!div || ! div.textContent) return ;
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
	//let fontSize = Math.floor(canvas.width * 0.05);
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
	const { winner, loser, scores} = data;
	let div = document.getElementById("wait");
	const msg = [
		"Congratulations! You've won 😁",
		"Better luck next time! 🥲"
	]
	div.style.display = 'none';
	// console.log(`winner ${winner} loser ${loser}`);
	if (gameLoopId)
		cancelAnimationFrame(gameLoopId);
	player.score = data["scores"][player.role];
	opponent.score = data["scores"][opponent.role];
	// console.log(`player's score: ${player.score}\nopponent's score ${opponent.score}`);
	if (player.whoAmI == winner)
		player.displayEndgameMessage(ctx, opponent.score, msg[0]);
	else
		player.displayEndgameMessage(ctx, opponent.score, msg[1]);

	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.close();
		socket = null;
	}
//	if (player.whoAmI == winner)
//		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["winner"]);
//	else
//		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["loser"]);
}

export function handleTourEndgame(data) {
	const { wait, winnerID, loserID } = data;
	
	console.log(player.whoAmI);
	console.log(player.role);
	console.log(loserID);
	console.log(winnerID);
	if (player.whoAmI == winnerID)
		player.scores++;
	else
		opponent.scores++;
	if (loserID == player.whoAmI)
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["loser"]);
	else
		player.displayEndgameMessage(ctx, opponent.score, endgameMsg["winner"]);
	cancelAnimationFrame(gameLoopId);
	gameLoopId = null
}

function getTimestamp() {
	const date = new Date();

	return `${date.getDate()}-${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

export async function setWhoAmI(data)
{
	player.whoAmI = data[player.role];
	opponent.whoAmI = data[opponent.role];
}

export async function handleStatus(data, tourSocket)
{
	if (tourSocket) {
		socket = tourSocket;
	}
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
		window.addEventListener("beforeunload", beforeUnloadHandlerRemote);
		setupControlsAI(player)
		gameLoop();
	}
}

export function handleUpdate(data)
{
	if (data.players)
	{
		player.update(data.players, data.scores);
		opponent.update(data.players, data.scores);
	}
	if (data.ball) {
		// targetBallX = data.ball.x * backFactor["x"];
		// targetBallY = data.ball.y * backFactor["y"];
		ball.x = data.ball.x * canvas.width;
		ball.y = data.ball.y * canvas.height;
	}
	if (gameStop) {
		stopTournamentGame();
	}
}

// if (data.players)
// 	{
// 		player.update(data.players, data.scores);
// 		opponent.update(data.players, data.scores);
// 	}
// 	if (data.ball) {
// 		ball.x = data.ball.x * canvas.width;
// 		ball.y = data.ball.y * canvas.height;
// 	}

//async function initializeWebSocket(roomId) {
async function initializeWebSocket() {
	//const roomID = new URLSearchParams(window.location.search).get("room") || "default";
	const roomId = 123;
	let retries = 0;

	const token = localStorage.getItem("access_token");
	if (!token)
	{
		console.log("No access token found");
		return ;
	}
	if (!socket)
	{
		socket = new WebSocket(`${protocolSocket}://${host}:${gamePort}/${protocolSocket}/G/${roomId}/?token=${token}`);
		// console.log("Socket created!");
	}
	socket.onopen = () => console.log("WebSocket connection established.");
	socket.onerror = (error) => {
		console.log("WebSocket encountered an error:", error);
		// alert("Unable to connect to the server. Please check your connection.");
	};
	socket.onclose = async (event) => {
		console.log("WebSocket connection closed");
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
		}
		// } else if (retries++ <= 5)
		// 	setTimeout(initializeWebSocket, 1000);
	};

	socket.onmessage = async (event) => {
		const data = JSON.parse(event.data);

		// console.log(`data type is: ${data.type}`);
		switch (data.type) {
			case "role":
				// handleRoleAssignment(data);
				console.log(`data type is: ${data.type}`);
				scaleGame(data);
				break;
			case "players":
				console.log(`data type is: ${data.type}`);
				setWhoAmI(data);
				// player.whoAmI = data[player.role];
				// opponent.whoAmI = data[opponent.role];
				socket.send(JSON.stringify({"type": "ready"}))
				break;
			case "status":
				//console.log(`player1: ${data.players.player1.id} scores: ${data.scores.player1}`);
				// handleStatus(data);
				if (data.wait) // data.wait [bool]
				{
					if (gameLoopId)
						cancelAnimationFrame(gameLoopId);
					if (data.countdown == 0)
						displayCountdown();
					else
					{
						// await readySteadyGo(data.countdown);
						await firstCountdown(() => {
							
                        });
						player.update(null, data.scores);
						opponent.update(data.players, data.scores);
						ball.resetPosition();
					}
				}
				else
				{
					setupControlsAI(player)
					// console.log(`Setup controls, ${player.role},  ${player.whoAmI}`)
					gameLoop();
				}
				break;
			case "update":
				if (data.players)
				{
					player.update(null, data.scores);
					opponent.update(data.players, data.scores);
				}
				if (data.ball) {
					ball.x = data.ball.x * canvas.width;
					ball.y = data.ball.y * canvas.height;
				}
				break ;
			case "reject":
				// alert(`Connection rejected: ${data.reason}`);
				socket.close();
				break ;
			case "endgame":
				console.log("This game's over!");
				handleEndgame(data);
				break ;
			default:
				console.log("Unhandled message type:", data.type);
		}
	};
}



function gameLoop() {
	gameLoopId = requestAnimationFrame(gameLoop);
	// console.log("IN GAME LOOP");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(0 0 0 / 75%)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	player.move(socket);
	player.draw(ctx);
	opponent.draw(ctx);
	player.drawScore(ctx);
	opponent.drawScore(ctx);
	//interpolateBall();
	ball.draw(ctx);

	
	//ball.move(player, opponent, gameLoopId, socket);

	if (gameStop) {
		stopTournamentGame();
	}
}

function resizeCanvas() {
	if (!canvas)
		return ;

    canvas = document.getElementById("newGameCanvas");
    const container = document.getElementById("newGameBoard");
	if (!canvas || !container)
		return ;

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

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
	//console.warn(`resize: newCanvas 2: W ${canvas.width} H ${canvas.height}`);
	ctx = canvas.getContext('2d');
	if (player)
		player.resize(newWidth, newHeight);
	if (opponent)
		opponent.resize(newWidth, newHeight);
	if (ball)
		ball.resize(newWidth, newHeight);
    canvas.width = newWidth;
    canvas.height = newHeight;
}

// Resize canvas when the window resizes
window.addEventListener("resize", resizeCanvas); 

export function startGame()
{
	canvas = document.getElementById('newGameCanvas');
	tourId = localStorage.getItem('currentTournamentId');

	if (!canvas)
	{
		// alert("Unable to display the game. Please, try again later");
		return ;
	} else {
		console.log("CANVAS: ", canvas);
	}
	ball = new Ball(canvas);
	resizeCanvas();
	targetBallX = ball.x;
	targetBallY = ball.y;
	gameStop = false;
	if (!tourId)
		initializeWebSocket();
	else {
		startTournamentGame();
		const button = document.getElementById('play-again');
        if (button) {
            button.textContent = "Quit Tournament";
            button.setAttribute("data-route", "/quit-tournament");
            button.setAttribute("replace-url", true);
        }
	}
}

export function cleanRemote() {
	if (gameLoopId)
		cancelAnimationFrame(gameLoopId);
	if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        socket = null;
    }
	gameLoopId = null;
	gameStop = true;
}

const beforeUnloadHandlerRemote = () => {
    if (tourId) {
		stopTournamentGame();
	}
};

export const removeBeforeUnloadListenerRemote = () => {
    window.removeEventListener("beforeunload", beforeUnloadHandlerRemote);
};
