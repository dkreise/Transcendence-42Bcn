import { makeAuthenticatedRequest } from "./login.js";
import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { Ball, Player } from "./localClasses.js";

var baseUrl = "http://localhost"; // change (parse) later

// export const gameLocal = () => {

//     if (!checkPermission) {
//         navigateTo('/login');
//     } else {
//         console.log("Navigating to /play-local/game");

//     // Retrieve the second player's name from the form
//         const playerNameInput = document.getElementById("player-name");
//         const secondPlayerName = playerNameInput ? playerNameInput.value.trim() : null;
//         console.log(`Stored second player name: ${secondPlayerName}`);
        
//         makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/play/", {
//             method: "GET",
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.get_name_html) {
//                 document.getElementById('content-area').innerHTML = data.get_name_html;
//             } else {
//                 console.log('Response: ', data);
//                 console.error('Failed to fetch second player:', data.error);
//             }
//         })
//         .catch(error => {
//             console.error('Catch error fetching second player page: ', error);
//         });
//         // const contentArea = document.getElementById('content-area');
//         // contentArea.innerHTML = '';
//         // const heading = document.createElement('h2');
//         // heading.textContent = 'Here will be the game board'
//         // contentArea.appendChild(heading);
//         // console.log(`Here will be the game board`);
//     }
//     // makeAuthenticatedRequest() //.py to POST the results
// }

// Game Initialization
let canvas = null;
let ctx = null;
let player1 = null;
let player2 = null;
let ball = null;
let gameLoopId = null;

// Game loop
function gameLoop() {
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players and ball
    player1.draw(ctx);
    player2.draw(ctx);
    ball.draw(ctx);

    // Draw scores
    player1.drawScore(ctx, 1);
    player2.drawScore(ctx, 2);

    // Move players and ball
    player1.move();
    player2.move();
    ball.move(player1, player2);

    // Endgame check
    if (player1.score >= 5 || player2.score >= 5) {
        const winner = player1.score > player2.score ? "Player 1 Wins!" : "Player 2 Wins!";
        const finalScore = `${player1.score} - ${player2.score}`;
        cancelAnimationFrame(gameLoopId);
        player1.displayEndgameMessage(ctx, finalScore, winner);
    }
}

// Event listeners for player controls
function setupControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player1.up = false;
        if (e.key === "s") player1.down = false;
        if (e.key === "ArrowUp") player2.up = false;
        if (e.key === "ArrowDown") player2.down = false;
    });
}

// Start game function
export function startLocalGame(playerName1, playerName2) {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Initialize players and ball
    player1 = new Player(canvas, playerName1, 0);
    player2 = new Player(canvas, playerName2, canvas.width - 10);
    ball = new Ball(canvas);

    setupControls();
    gameLoop();
}