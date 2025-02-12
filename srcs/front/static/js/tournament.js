import { loadHomePage } from "./home.js";
import { makeAuthenticatedRequest } from "./login.js";
import { navigateTo } from "./main.js";

var baseUrl = "http://localhost"; // change (parse) later

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
    makeAuthenticatedRequest(baseUrl + ":8001/api/tournament-creator/", 
        {method: "GET", credentials: "include"})
    .then((response) => response.json())
    .then(data => {
        if (data.success) {
            alert("tournament is successfully created!");
            console.log(data.tournament_id);
            loadWaitingRoomPage(data.tournament_id);
    
    // .then(data => {
    //     if (data.tournament_creator_html) {
    //         document.getElementById('content-area').innerHTML = data.tournament_creator_html;
    //         
            
    //       waitingUntilTournamentStarts(data.tournamentId);
        } else {
            console.error('Create tournament page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const loadJoinTournamentPage = () => {
    makeAuthenticatedRequest(baseUrl + ":8001/api/join-tournament-page/", 
        {method: "GET", credentials: "include"})
    .then((response) => response.json())
    .then(data => {
        if (data.join_tournament_html) {
            document.getElementById('content-area').innerHTML = data.join_tournament_html;
        } else {
            console.error('Join tournament page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const handleJoinTournament = () => {
    const tournamentId = document.getElementById('tournament-id-input').value.trim();


    console.log('IDDDDDDD ', tournamentId);
    if (!tournamentId) {
        alert("Please enter a tournament ID.");
        return;
    }



    makeAuthenticatedRequest(`${baseUrl}:8001/api/join-tournament/${tournamentId}/`,
        {method: "POST", credentials: "include"})
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Successfully joined the tournament!");
            console.log('TOURNAMENT IDDDDDDDDD: ', tournamentId);
            loadWaitingRoomPage(tournamentId);
        } else {
            alert(data.error || "Failed to join tournament.");
        }
    })
    .catch(error => {
        console.error('Error joining tournament', error);
        alert("An error occurred. Please try again.");
    });
};

export const loadWaitingRoomPage = (tournamentId) => {
    makeAuthenticatedRequest(`${baseUrl}:8001/api/waiting-room-page/${tournamentId}`, 
        {method: "GET", 
        credentials: "include"})
    .then((response) => response.json())
    .then(data => {
        if (data.waiting_room_html) {
            document.getElementById('content-area').innerHTML = data.waiting_room_html;
            waitingUntilTournamentStarts(data.tournament_id);
        } else {
            console.error('Waiting room page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

const waitingUntilTournamentStarts = (tournamentId) => {
    const startButton = document.getElementById('start-tournament-button');
    const homeButton = document.getElementById('home-button');
    
    // const intervalId = setInterval(() => {
        makeAuthenticatedRequest(`${baseUrl}:8001/api/get-players-count/${tournamentId}`, 
            {method: "GET", credentials: "include"})
        .then(response => response.json())
        .then(data => {

            if (data.players_count !== undefined) {
             
                const playerCountElement = document.querySelector('.tournament-value.d-inline');
                const currentPlayerCount = parseInt(playerCountElement.textContent);

                if (data.players_count !== currentPlayerCount) {
                    playerCountElement.textContent = data.players_count;
                    //loadWaitingRoomPage(tournamentId);
                }

                if (data.players_count >= 4) {
                    clearInterval(intervalId);
                    loadBracketTournamentPage(tournamentId);
                }
            }
        })
        .catch(error => {
            console.error('Error checking player count', error);
        });
    // }, 10000);

    startButton.addEventListener('click', () => {
        // clearInterval(intervalId);
        //navigateTo('/tournament-bracket', true);
        loadBracketTournamentPage(tournamentId);
    });

    homeButton.addEventListener('click', () => {
        // clearInterval(intervalId);
        loadHomePage('/home');
    });

};

export const loadBracketTournamentPage = (tournamentId) => {
    console.log(tournamentId);
    makeAuthenticatedRequest(`${baseUrl}:8001/api/tournament-bracket-page/${tournamentId}`, 
        {method: "GET",
        credentials: "include"})
    .then((response) => response.json())
    .then(data => {
        if (data.tournament_bracket_html) {
            document.getElementById('content-area').innerHTML = data.tournament_bracket_html;
            if (data.needs_to_play) {
                console.log('Player needs to play!!');
                const bracketSection = document.getElementById("bracket");
                const playButton = document.createElement("button");
                playButton.id = "play-game-in-tournament";
                playButton.textContent = "Play My Game";
                if (data.opponent == "@AI") {
                    playButton.setAttribute("data-route", "/play-ai");
                    // Pass arguments as a JSON string inside `data-args`
                    playButton.setAttribute("data-args", JSON.stringify({ tournament: "true", tournamentId: tournamentId }));
                }
                bracketSection.append(playButton);
            } else {
                console.log('Player is not playing..');
            }
        } else {
            console.error('Tournament bracket page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const saveTournamentGameResult = (tournamentId, winner, looser) => {
    const button = document.getElementById('play-again');
    if (button) {
        button.textContent = "Back to Tournament Page";
    }

    makeAuthenticatedRequest(`${baseUrl}:8001/api/save-tournament-game-result/${tournamentId}/`, {
        method: "POST",
        body: JSON.stringify({
            'winner': winner,  // Stringify the body data
            'looser': looser,
        }),
        headers: {"Content-Type": "application/json"},
    })
    .then(response => {
        console.log('Raw response:', response);  // Add this line to inspect the raw response
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('game results saved!');
        } else {
            console.log('Response: ', data);
            console.error('Failed to fetch the local game:', data.error);
        }
    })
    .catch(error => {
        console.error('Catch error loading local game: ', error);
    });

function youNameIt(tourId) {
	const token = localStorage.getItem("access_token");
	if (!token)
	{
		console.warn("No access token found");
		return ;
	}
	console.log("token is: " + token);
	socket = new WebSocket(`ws://localhost:8001/ws/T/${tourId}/?token=${token}`);

	socket.onopen = () => console.log("WebSocket connection established")
	socket.onerror = (error) => {
		console.error("WebSocket encountered an error: ", error);
		alert("Unable to connect to the server. Please check your connection.");
		};
	socker.onclose = () => {
		console.warn("WebSocket connection close. Retrying...");
		setTimeout(youNameIt, 1000) //waits 1s and tries to reconnect
	};

	socket.onmessage = (event) = > { //we're receiving messages from the backend via WB
		const data = JSON.parse(event.data);

		console.log(data);
		switch(data.type)
		{
			case "totalPlayers":
				console.log("current number of players in the tournament: " + data.total);
			case "html":
				//render html or something
		}
	}
}
