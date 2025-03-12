import { makeAuthenticatedRequest } from "./login.js";
import { navigateTo } from "./main.js";
import { clearIntervalIDGame, removeBeforeUnloadListenerAI } from "./AIGame.js"
import { gameAI, playOnline, getDictFor3DGame } from "./game.js";
import {handleRoleAssignment, scaleGame, setWhoAmI, handleStatus, handleUpdate, handleEndgame, handleTourEndgame, cleanRemote } from "./remoteGame.js"
import { drawHeader } from "./main.js";
import { removeBeforeUnloadListenerRemote } from "./remoteGame.js"
import { checkToken } from "./onlineStatus.js";

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const protocolSocket = window.env.PROTOCOL_SOCKET;
const gamePort = window.env.GAME_PORT;

let socket = null, dict = null;

export const manageTournamentHomeBtn = () => { 
    const inTournament = localStorage.getItem('inTournament');
    if (!socket || !inTournament) {
        if (socket) {
            console.log("socket there is..");
            if (socket.readyState === WebSocket.OPEN)
            {
                socket.send(JSON.stringify({ "type": "get_status" }));
            }        
        } else {
            console.log("socket is not here..");
            navigateTo('/tournament-home', true);
        }  
        return;      
    }
    
    if (inTournament === 'waiting') {
        navigateTo('/waiting-room', true);
    } else if (inTournament === 'playing') {
        navigateTo('/tournament-bracket', true);
    } else if (inTournament === 'finished') {
        navigateTo('/end-tournament', true);
    } else {
        navigateTo('/tournament-home', true);
    }
};

export const loadTournamentHomePage = () => {
    if (socket) {
        navigateTo('/tournament');
        return;
    }
    drawHeader('main').then(() => {
      return  makeAuthenticatedRequest(baseUrl + gamePort + "/api/tournament-home-page/", 
            {method: "GET", credentials: "include"})
        .then(response => response ? response.json() : null)
        .then(data => {
            if (data && data.tournament_home_page_html) {
                document.getElementById('content-area').innerHTML = data.tournament_home_page_html;
            } else {
                console.error('Tournament home page HTML not found in response:', data);
            }
        })
        .catch(error => {
            console.error('Error loading page', error);
        });
    })     
};

export const createTournament = async () => {
    const nPlayers = getNumberOfPlayers();
    const tourId = await getTournamentId(); 
    // alert(tourId)
    if (tourId > 0) {
        tournamentConnect(tourId, nPlayers)
            .then(() => console.log("Successfully connected!"))
            .catch(() => console.log("Can't connect to tournament."));
    }
};

export const joinTournament = () => {
    if (! document.getElementById('tournament-id-input')) {
        navigateTo('/tournament-home', true);
        return;
    }
    const tourId = document.getElementById('tournament-id-input').value.trim();
    if (! /^\d{7}$/.test(tourId)) {
        alert("The tournament ID is not correct.");
        return;
    }
    tournamentConnect(tourId)
        .then(() => console.log("Successfully connected!"))
        .catch(() => console.log("Can't connect to tournament."));
};

function isOnWaitingRoomPage() {
	return window.location.pathname.includes("waiting-room");
}

function isOnBracketPage() {
	return window.location.pathname.includes("bracket");
}

function isOnTournamentHomePage() {
	return (window.location.pathname.includes("tournament-home") || window.location.pathname.includes("join-tournament") || window.location.pathname.includes("create-tournament"));
}


export const loadWaitingRoomPage = () => {
    if (!socket) {
        console.log("socket is not here..");
        navigateTo('/tournament-home', true);
        return;
    }
    if (socket.readyState === WebSocket.OPEN)
	{
		const data = {
			"type": "waiting_room_page_request",
		};
		socket.send(JSON.stringify(data));
	}
};

export const loadBracketTournamentPage = () => {
    if (!socket) {
        console.log("socket is not here..");
        navigateTo('/tournament-home', true);
        return;
    }
    if (socket.readyState === WebSocket.OPEN)
	{
        const data = {
			"type": "bracket_page_request",
		};
		socket.send(JSON.stringify(data));
        // console.log("we have sent the request for bracket page!")
	}
    else {
        console.log(socket.readyState);
        // alert("waiting for websoket connection")
        // loadBracketTournamentPage();
    }
};

export const loadFinalTournamentPage = () => {
    if (!socket) {
        console.log("socket is not here..");
        navigateTo('/tournament-home', true);
        return;
    }
    if (socket.readyState === WebSocket.OPEN)
	{
        const data = {
			"type": "final_page_request",
		};
		socket.send(JSON.stringify(data));
	}
};

export const quitTournament = () => {
    clearIntervalIDGame();
    removeBeforeUnloadListenerAI();
    removeBeforeUnloadListenerRemote();
    console.log("QUIT button clicked")
    if (!socket) {
        navigateTo('/home', true);
        return;
    }
    localStorage.setItem("user_quit", "true");
    if (socket.readyState === WebSocket.OPEN)
        {
            const data = {
                "type": "quit",
            };
            socket.send(JSON.stringify(data));
        }
}

export const saveTournamentGameResult = (winner, loser, playerScore, AIScore) => {
    const button = document.getElementById('play-again');
    if (button) {
        button.textContent = "Back to Tournament Page";
        button.setAttribute("data-route", "/tournament-bracket");
    }
    removeBeforeUnloadListenerAI();
    removeBeforeUnloadListenerRemote();
    console.log("Sending request to save the game result..");

    if (socket.readyState === WebSocket.OPEN)
    {
        const data = {
            "type": "game_result",
            "winner": winner,
            "winner_score": playerScore > AIScore ? playerScore : AIScore,
            "loser": loser,
            "loser_score": playerScore > AIScore ? AIScore : playerScore,
        };
        socket.send(JSON.stringify(data));
    }
}

export const tournamentGameRequest = () => {
    clearIntervalIDGame();
    if (socket && socket.readyState === WebSocket.OPEN)
    {
        socket.send(JSON.stringify({ "type": "wants_to_play" }));
    } else {
        navigateTo('/tournament', true);
    }
}

export const tournamentGameAIstart = (data, tourId) => {
    if (data.needs_to_play) {
        let args = {
            tournament: true,
            tournamentId: tourId,
        }
        gameAI(args);                    
    } else {
        navigateTo('/tournament', true);
    }
}

function addGameButton(data) {
    // tournament ID needed!! or maybe not..
    console.log('Player needs to play!!');
    const bracketSection = document.getElementById("bracket");
    // if (bracketSection) {
    //     console.log("bracket section here");
    // } else {
    //     console.log("no bracket section...");
    // }
    const playButton = document.createElement("button");
    playButton.id = "play-game-in-tournament";
    playButton.classList.add("button-trn");
    playButton.style.marginTop = "10%";
    playButton.style.width = "40%";
    
    const span = document.createElement("span");
    span.classList.add("button-content-trn");
    // const dictionary = getDictFor3DGame();
    span.textContent = "Play my game";
    // span.textContent = dictionary['play_my_game'];

    playButton.appendChild(span);

    // Seleccionar el contenedor donde está el botón existente
    const existingButtonContainer = document.querySelector(".row.justify-content-center.mt-4 .col-12");

    // Crear un nuevo contenedor para colocar los botones en línea
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("d-flex", "justify-content-between", "gap-3"); // Flexbox para alinearlos

    // Mover el botón existente dentro del nuevo contenedor
    const existingButton = existingButtonContainer.querySelector("button");
    buttonWrapper.appendChild(existingButton);

    // Agregar el nuevo botón
    buttonWrapper.appendChild(playButton);

    // Reemplazar el contenido del contenedor con el nuevo diseño
    existingButtonContainer.appendChild(buttonWrapper);
    
    if (data.opponent == "@AI") {
        playButton.setAttribute("data-route", '/tournament-game-ai');
        // Pass arguments as a JSON string inside `data-args`
        // playButton.setAttribute("data-args", JSON.stringify({ tournament: "true", tournamentId: 1234 }));
    }
	else {
        playButton.setAttribute("data-route", '/tournament-game-remote');
	}
    playButton.addEventListener('click', () => {
        if (socket.readyState === WebSocket.OPEN)
        {
			//CHANGED BY diana
            socket.send(JSON.stringify({ "type": "game_started" }));
            // socket.send(JSON.stringify({ "type": "start_game" }));
        }
    });
    //bracketSection.append(playButton);
}

function changePage(data) {
    drawHeader('main');
    document.getElementById('content-area').innerHTML = data.html;
    if (data.redirect) {
        let path = data.redirect;
        // history.pushState({ path }, null, path);
        history.replaceState({ path }, null, path);
    }
    if (data.needs_to_play) {
        addGameButton(data);
    }
}

function uploadTournamentPage(data) {
    // console.log("CUR PATHNAME: ", window.location.pathname);
    if (data.redirect == "/tournament-bracket") {
        if (isOnWaitingRoomPage() || isOnBracketPage() || isOnTournamentHomePage()) {
            changePage(data);
        }
    } else if (data.redirect == "/end-tournament") {
        if (isOnBracketPage()) {
            changePage(data);
        }
    }
    if (data.request) {
        // console.log("IT WAS A REQUEST");
        changePage(data);
    }

    // document.getElementById('content-area').innerHTML = data.html;
    const bracketSection = document.getElementById("bracket");
    // if (bracketSection) {
    //     console.log("bracket section here");
    // } else {
    //     console.log("no bracket section...");
    // }

    // if (data.needs_to_play) {
    //     addGameButton(data);
    // }
    setTournamentStatus(data.status)
    
    if (data.status === 'finish') {
        console.log("tournament is finished");
        //TODO: manage disconnect:
            //1. disconnect socket when you leave // after 5 second of tourn finishes??
            //2. remove localstorage: localStorage.removeItem('inTournament'); (id needed)
    }
}

function updatePlayerCount(data) {
    if (isOnWaitingRoomPage()) {
        document.getElementById('cur-player-cnt').textContent = data.player_cnt;
        // let prev_player_cnt = document.getElementById('cur-player-cnt');
        // if (prev_player_cnt) {
        //     prev_player_cnt.textContent = data.player_cnt;
        // }
    }
}

export async function tournamentConnect(tourId, nPlayers=null) {
    return new Promise((resolve, reject) => {
        const access_token = localStorage.getItem("access_token");
        const token = checkToken(access_token);
	if (!token)
	{
		console.log("No access token found");
        reject("No access token found");
		return ;
	}

    localStorage.setItem("currentTournamentId", tourId);
    console.log(" Tour id is: " + tourId + " // Num players: " + nPlayers);

    if (nPlayers) {
        socket = new WebSocket(`${protocolSocket}://${host}:${gamePort}/${protocolSocket}/T/${tourId}/?nPlayers=${nPlayers}&token=${token}`);
    } else {
        socket = new WebSocket(`${protocolSocket}://${host}:${gamePort}/${protocolSocket}/T/${tourId}/?token=${token}`);
    }
    
    socket.onopen = () => {
        console.log("WebSocket connection established");
        let status = localStorage.getItem('inTournament');
        if (!status)
            localStorage.setItem('inTournament', 'waiting');
        window.addEventListener("beforeunload", () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                localStorage.setItem("currentTournamentId", tourId);
                localStorage.setItem("tournamentReload", true);
            }
        });
        resolve(socket); // Resolve the promise once the socket is open
    };
    
    socket.onerror = (error) => {
		console.log("WebSocket encountered an error: ", error);
		alert("ONERROR: Unable to connect to the server. Please check your connection.");
        localStorage.removeItem('inTournament');
        localStorage.removeItem("user_quit");
        localStorage.removeItem("currentTournamentId");
        localStorage.removeItem("gameState");
        removeBeforeUnloadListenerAI();
        removeBeforeUnloadListenerRemote();
        navigateTo('/home', true);
        reject("WebSocket error");
	};

	socket.onclose = () => {
        socket = null;
        cleanRemote();
        removeBeforeUnloadListenerAI();
        removeBeforeUnloadListenerRemote();
        if (localStorage.getItem("user_quit") == "true") {
            console.log("User quit. No reconnection.");
            localStorage.removeItem('inTournament');
            localStorage.removeItem("user_quit");
            localStorage.removeItem("currentTournamentId");
            localStorage.removeItem("gameState");
            navigateTo('/home', true);
        } else if (localStorage.getItem("tournamentReload")) {
            console.log("Closing websocket.");
        } else {
            console.log("Closing websocket onclose");
            localStorage.removeItem('inTournament');
            localStorage.removeItem("currentTournamentId");
            localStorage.removeItem("gameState");
        }
	};

	socket.onmessage = async (event) => { //we're receiving messages from the backend via WB
		const data = JSON.parse(event.data);
        localStorage.setItem("currentTournamentId", tourId);

		// console.log(data);
		switch(data.type)
		{
			case "totalPlayers":
				console.log("current number of players in the tournament: " + data.total);
                break;
			case "html":
				uploadTournamentPage(data);
                break;
            case "new_player_cnt":
                updatePlayerCount(data);
                break;
            case "game_update":
                alert("GAME_UPDATE??  A player has disconnected. Waiting for reconnection...");
                break;
            case "full":
                console.log("Tournament is full:", data.message);
                alert(data.message);
                localStorage.removeItem('inTournament');
                localStorage.removeItem("user_quit");
                localStorage.removeItem("currentTournamentId");
                socket.close();
                break;
            case "needs_to_play":
                if (!data.needs_to_play)
                    navigateTo('/tournament', true);
                else if (data.opponent == "@AI") {
                    tournamentGameAIstart(data, tourId);
                } else {
                    playOnline(tourId);
                }
                break;
            case "tournament_status":
                localStorage.setItem('inTournament', data.status);
                navigateTo('/tournament');
                break;
			case "role":
				// handleRoleAssignment(data);
				scaleGame(data);
				break;
			case "players":
				await setWhoAmI(data, socket);
				// socket.send(JSON.stringify({"type": "ready"}));
				break;
			case "status":
				await handleStatus(data, socket);
				break;
			case "update":
				handleUpdate(data);
				break;
			case "endgame":
                // handleTourEndgame(data);
                handleEndgame(data);
                // saveTournamentGameResult(data["winner"], data["loser"], data["scores"]["player1"], data["scores"]["player2"]);
				break;
			case "reject":
				// alert(`Connection rejected: ${data.reason}`);
                console.log(`Connection rejected: ${data.reason}`);
				//return client to tournament home page or bracket page
				break;
            default:
                console.log("Unhandled message type: ", data.type);
		}
	};
});
}

export function startTournamentGame() {
	socket.send(JSON.stringify({"type": "start_game"}));
}

export function stopTournamentGame() {
    removeBeforeUnloadListenerRemote();
    if (socket)
        socket.send(JSON.stringify({"type": "stop_game"}));
}

////////////////// UTILS //////////////////////

async function getTournamentId() {
    let id = Math.floor(1000000 + Math.random() * 9000000); // Ensures a 7-digit number
    // let id = 1234567
    try {
        const response = await makeAuthenticatedRequest(baseUrl + gamePort + `/api/check-tournament/${id}/`, 
            { method: "GET", credentials: "include" });
        if (!response) return -1;
        const data = await response.json();
        
        console.log("ACTIVE?");
        console.log(data.active);

        if (!data.active) {
            return id;  // If not active, return the id
        } else {
            alert("Oops. Try again.");
            return -1;  // If the ID is active, return -1
        }
    } catch (error) {
        console.error('Failed to fetch tournament status:', error);
        return -1;  // Return -1 in case of an error
    }
}

function getNumberOfPlayers() {
    if (! document.getElementById('create-tournament-form')) {
        navigateTo('/tournament-home', true);
        return;
    }
//     const nPlayers = document.getElementById('tournament-count').value;
    const nPlayers = document.querySelector('input[name="btn"]:checked').value;
    console.log("aquiiiiiiiiiiii", nPlayers);
    const validPlayers = ["3", "4", "7", "8", "1", "2"];
    
    if (!validPlayers.includes(nPlayers)) {
        alert("Incorrect number of players");
        return null;
    }
    return nPlayers;
}

function setTournamentStatus(status) {
    if (status) {
        localStorage.setItem('inTournament', status);
    }
}

export function disconnectTournamentWS() {
    if (socket) {
        localStorage.setItem("user_quit", "true");
        if (socket.readyState === WebSocket.OPEN)
            {
                const data = {
                    "type": "quit",
                };
                socket.send(JSON.stringify(data));
            }
    }
}

// export function changePathFromGameCheck(prevPath, curPath) {
//     // '/tournament-game-ai': tournamentGameRequest,
//     // '/tournament-game-remote': tournamentGameRequest,
//     const pathAi = '/tournament-game-ai';
//     const pathRemote = '/tournament-game-remote';
//     let pathChange = true;
//     if (prevPath == pathAi && curPath == pathAi) {
//         pathChange = false;
//     } else if (prevPath == pathRemote && curPath == pathRemote) {
//         pathChange = false;
//     }
//     if (pathChange && prevPath == pathAi) {
//         console.log("CHANGING PATH from ai game");
//     } else if (pathChange && prevPath == pathRemote) {
//         console.log("CHANGING PATH from remote game");
//     }
// }

/*
back/forward , path change , reload ---> you lose
back/forward DONE (with popstate)
but
path change , reload ---> main.js from start, all vars in games are cleared
path change is the same as reload
event listener before onload -> game end
*/

function totalPlayers() {
    console.log("current number of players in the tournament: " + data.total);
}

function gameUpdate() {
    alert("GAME_UPDATE??  A player has disconnected. Waiting for reconnection...");
}

function tourFull() {
    console.log("Tournament is full:", data.message);
    alert(data.message);
    localStorage.removeItem('inTournament');
    localStorage.removeItem("user_quit");
    localStorage.removeItem("currentTournamentId");
    socket.close();
}

function needsPlay(data, tourId) {
    if (!data.needs_to_play)
        navigateTo('/tournament', true);
    else if (data.opponent == "@AI") {
        tournamentGameAIstart(data, tourId);
    } else {
        playOnline(tourId);
    }
}

function tourStatus(data) {
    localStorage.setItem('inTournament', data.status);
    navigateTo('/tournament');
}