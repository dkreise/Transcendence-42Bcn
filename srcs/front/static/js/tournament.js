import { makeAuthenticatedRequest } from "./login.js";

var baseUrl = "http://localhost"; // change (parse) later

export const loadTournamentHomePage = () => {
    makeAuthenticatedRequest(baseUrl + ":8001/api/tournament-home-page/", 
        {method: "GET"})
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

export const loadTournamentCreatorPage = () => {
    makeAuthenticatedRequest(baseUrl + ":8001/api/tournament-creator/", 
        {method: "GET"})
    .then((response) => response.json())
    .then(data => {
        if (data.tournament_creator_html) {
            document.getElementById('content-area').innerHTML = data.tournament_creator_html;
            waitingUntilTournamentStarts(data.id);
        } else {
            console.error('Create tournament page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

const waitingUntilTournamentStarts = (tournamentId) => {
    const startButton = document.getElementById('start-tournament-button');
    const homeButton = document.getElementById('home-button');

    const intervalId = setInterval(() => {
        makeAuthenticatedRequest(`${baseUrl}:8001/api/get-players-count/${tournamentId}`, 
            {method: "GET"})
        .then(response => response.json())
        .then(data => {
            if (data.player_count !== undefined) {

                // document.querySelector(".tournament-value").textContent = data.player_count;

                if (data.player_count >= 4) {
                    clearInterval(intervalId);
                    loadBracketTournamentPage(tournamentId);
                }
            }
        })
        .catch(error => {
            console.error('Error checking player count', error);
        });
    }, 1000);

    startButton.addEventListener('click', () => {
        clearInterval(intervalId);
        loadBracketTournamentPage(tournamentId);
    });

    homeButton.addEventListener('click', () => {
        clearInterval(intervalId);
        window.location.href = '/home';
    });
};

export const loadJoinTournamentPage = () => {
    makeAuthenticatedRequest(baseUrl + ":8001/api/join-tournament-page/", 
        {method: "GET"})
    .then((response) => response.json())
    .then(data => {
        if (data.join_tournament_html) {
            document.getElementById('content-area').innerHTML = data.join_tournament_html;
            
            // Add event listener to the "Join Tournament" button
            const joinButton = document.getElementById('join-tournament-button');
            if (joinButton) {
                joinButton.addEventListener('click', handleJoinTournament);
            }
        } else {
            console.error('Join tournament page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

const handleJoinTournament = () => {
    const tournamentId = document.getElementById('tournament-id-input').value;
    const playerCount = document.getElementById('number-of-players') ? document.getElementById('number-of-players').value : null;

    if (!tournamentId) {
        console.error('Tournament ID is required'); //TODO: POPUP
        return;
    }

    const accessToken = localStorage.getItem("access_token");

    makeAuthenticatedRequest(baseUrl + ":8001/api/join-tournament/", {
        method: "POST",
        body: JSON.stringify({
            tournament_id: tournamentId,
            player_count: playerCount
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Successfully joined the tournament');
            // Do something after joining, like updating UI
        } else {
            console.error('Error joining the tournament:', data.error);
        }
    })
    .catch(error => {
        console.error('Error sending join tournament request', error);
    });
};

export const loadBracketTournamentPage = (tournamentId) => {
    makeAuthenticatedRequest(`${baseUrl}:8001/api/tournament-bracket-page/${tournamentId}`, {method: "GET"})
    .then((response) => response.json())
    .then(data => {
        if (data.tournament_bracket_html) {
            document.getElementById('content-area').innerHTML = data.tournament_bracket_html;
        } else {
            console.error('Tournament bracket page HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};
