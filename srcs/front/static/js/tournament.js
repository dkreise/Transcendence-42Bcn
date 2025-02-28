import { loadHomePage } from "./home.js";
import { makeAuthenticatedRequest } from "./login.js";
import { navigateTo } from "./main.js";
import { clearIntervalIDGame } from "./AIGame.js"

var baseUrl = "http://localhost"; // TODO: change (parse) later
let socket = null;

export const manageTournamentHomeBtn = () => { 
    const inTournament = localStorage.getItem('inTournament');
    
    if (inTournament === 'waiting') {
        navigateTo('/waiting-room');
    } else if (inTournament === 'playing') {
        navigateTo('/tournament-bracket');
    } else if (inTournament === 'finished') {
        navigateTo('/end-tournament');
    } else {
        navigateTo('/tournament-home');
    }
};

export const loadTournamentHomePage = () => {
    makeAuthenticatedRequest(baseUrl + ":8001/api/tournament-home-page/", 
        {method: "GET", credentials: "include"})
    .then((response) => response.json())
    .then(data => {
        if (data.tournament_home_page_html) {
            document.getElementById('content-area').innerHTML = data.tournament_home_page_html;
        } else {
            console.error('Tournament home page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const createTournament = () => {
    const nPlayers = getNumberOfPlayers();
    const tourId = getTournamentId(); //TODO: check to avoid not repeating id?

    tournamentConnect(tourId, nPlayers);
};

export const joinTournament = () => {
    const tourId = document.getElementById('tournament-id-input').value.trim();
    if (!tourId) {
        alert("Please enter a tournament ID.");
        return;
    }
    tournamentConnect(tourId);
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
    if (socket)
        console.log("socket there is..");
    if (socket.readyState === WebSocket.OPEN)
	{
		const data = {
			"type": "waiting_room_page_request",
		};
		socket.send(JSON.stringify(data));
	}
};

export const loadBracketTournamentPage = () => {
    if (socket.readyState === WebSocket.OPEN)
	{
        const data = {
			"type": "bracket_page_request",
		};
		socket.send(JSON.stringify(data));
        console.log("we have sent the request for bracket page!")
	}
    else {
        console.log(socket.readyState);
        // alert("waiting for websoket connection")
        // loadBracketTournamentPage();
    }
};

export const loadFinalTournamentPage = () => {
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
    console.log("QUIT button clicked")
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

function addGameButton(data) {
    // tournament ID needed!! or maybe not..
    console.log('Player needs to play!!');
    const bracketSection = document.getElementById("bracket");
    if (bracketSection) {
        console.log("bracket section here");
    } else {
        console.log("no bracket section...");
    }
    const playButton = document.createElement("button");
    playButton.id = "play-game-in-tournament";
    playButton.textContent = "Play My Game";
    if (data.opponent == "@AI") {
        playButton.setAttribute("data-route", '/tournament-game-ai');
        // Pass arguments as a JSON string inside `data-args`
        // playButton.setAttribute("data-args", JSON.stringify({ tournament: "true", tournamentId: 1234 }));
    }
    playButton.addEventListener('click', () => {
        if (socket.readyState === WebSocket.OPEN)
        {
            socket.send(JSON.stringify({ "type": "game_started" }));
        }
    });
    bracketSection.append(playButton);
}

function changePage(data) {
    document.getElementById('content-area').innerHTML = data.html;
    if (data.redirect) {
        let path = data.redirect;
        history.pushState({ path }, null, path);
    }
    if (data.needs_to_play) {
        addGameButton(data);
    }
}

function uploadTournamentPage(data) {
    console.log("CUR PATHNAME: ", window.location.pathname);
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
        console.log("IT WAS A REQUEST");
        changePage(data);
    }

    // document.getElementById('content-area').innerHTML = data.html;
    const bracketSection = document.getElementById("bracket");
    if (bracketSection) {
        console.log("bracket section here");
    } else {
        console.log("no bracket section...");
    }

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

export function tournamentConnect(tourId, nPlayers=null) {
    return new Promise((resolve, reject) => {
	const token = localStorage.getItem("access_token");
	if (!token)
	{
		console.warn("No access token found");
        reject("No access token found");
		return ;
	}

    localStorage.setItem("currentTournamentId", tourId);
    console.log(" Tour id is: " + tourId + " // Num players: " + nPlayers);

    if (nPlayers) {
        socket = new WebSocket(`ws://localhost:8001/ws/T/${tourId}/?nPlayers=${nPlayers}&token=${token}`);
    } else {
        socket = new WebSocket(`ws://localhost:8001/ws/T/${tourId}/?token=${token}`);
    }
    
    socket.onopen = () => {
        console.log("WebSocket connection established");
        let status = localStorage.getItem('inTournament');
        if (!status)
            localStorage.setItem('inTournament', 'waiting');
        resolve(socket); // Resolve the promise once the socket is open
    };
    
    socket.onerror = (error) => {
		console.error("WebSocket encountered an error: ", error);
		alert("Unable to connect to the server. Please check your connection.");
        localStorage.removeItem('inTournament');
        localStorage.removeItem("user_quit");
        localStorage.removeItem("currentTournamentId");
            navigateTo('/home', true);
        reject("WebSocket error");
	};

	socket.onclose = () => {
		// //console.warn("WebSocket connection close. Retrying...");
        // localStorage.removeItem('inTournament');
		// //setTimeout(tournamentConnect, 1000) //waits 1s and tries to reconnect
        // navigateTo('/home', true);

        // alert(localStorage.getItem("user_quit"));
        if (localStorage.getItem("user_quit") !== "true") {
            alert("WebSocket connection close. Retrying...");
            console.log("Disconnected unexpectedly. Reconnecting in 3 seconds...");
            setTimeout(() => connectWebSocket(tourId), 3000);
        } else {
            console.log("User quit. No reconnection.");
            localStorage.removeItem('inTournament');
            localStorage.removeItem("user_quit");
            localStorage.removeItem("currentTournamentId");
            navigateTo('/home', true);
        }
	};

	socket.onmessage = (event) => { //we're receiving messages from the backend via WB
		const data = JSON.parse(event.data);
        localStorage.setItem("currentTournamentId", tourId);

		console.log(data);
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
                alert("A player has disconnected. Waiting for reconnection...");
                break;
            default:
                console.warn("Unhandled message type: ", data.type);
		}
	};
});
}

////////////////// UTILS //////////////////////

function getTournamentId() {
    return Math.floor(1000000 + Math.random() * 9000000); // Ensures a 7-digit number
}

function getNumberOfPlayers() {
    const nPlayers = document.getElementById('tournament-count').value;
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