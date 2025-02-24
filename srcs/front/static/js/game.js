import { makeAuthenticatedRequest } from "./login.js";
// import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { startAIGame,clearIntervalIDGame } from "./AIGame.js";
import { startLocalGame } from "./localGame.js";
import { startGame } from "./remoteGame.js"; 
import { start3DAIGame, start3DLocalGame } from "./3DLocalGame.js";
import { loadBracketTournamentPage, quitTournament } from "./tournament.js";


var baseUrl = "http://localhost"; // change (parse) later

export const playLocal = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log('Loading get second name page...')
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/get-name/", {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {
            if (data.get_name_html) {
                document.getElementById('content-area').innerHTML = data.get_name_html;
            } else {
                console.log('Response: ', data);
                console.error('Failed to fetch second player:', data.error);
            }
        })
        .catch(error => {
            console.error('Catch error fetching second player page: ', error);
            if (error == "No access token.")
                navigateTo('/login');
        });
    }
} 

export const playAI = (args) => {
    clearIntervalIDGame();
    const savedState = localStorage.getItem("gameState");
    if (savedState)
        console.log("the state is here!! we need to remove it");
    else
    console.log("the state is not here!!");
    localStorage.removeItem("gameState");
    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Playing AI game. Tournament mode:", args?.tournament); 
        if (args?.tournament === "true") {
            console.log("This is a tournament game! in playAI");
            gameAI(args);
        } else {
            console.log('Loading get difficulty page...')
            makeAuthenticatedRequest(baseUrl + ":8001/api/game/ai/get-difficulty", {
                method: "GET",
            })
            .then(response => response.json())
            .then(data => {
                if (data.get_difficulty_html) {
                    document.getElementById('content-area').innerHTML = data.get_difficulty_html;
                } else {
                    console.log('Response: ', data);
                    console.error('Failed to fetch difficulty:', data.error);
                }
            })
            .catch(error => {
                console.error('Catch error fetching difficulty page: ', error);
                if (error == "No access token.")
                    navigateTo('/login');
            });
        }
    }
} 

export const gameLocal = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Navigating to /play-local/game");

    // Retrieve the second player's name from the form
        const playerNameInput = document.getElementById("player-name");
        const secondPlayerName = playerNameInput ? playerNameInput.value.trim() : null;
        console.log(`Stored second player name: ${secondPlayerName}`);
        console.log(`Username: ${localStorage.getItem('username')}`);
        if (secondPlayerName === localStorage.getItem('username')) {
            alert("Both names cannot be equal. Set another name");
            navigateTo('/play-local');
            return ;
        }
        
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/play/", {
            method: "POST",
            body: JSON.stringify({
                'second-player': secondPlayerName,  // Stringify the body data
            }),
            headers: {"Content-Type": "application/json"},
        })
        .then(response => {
            console.log('Raw response:', response);  // Add this line to inspect the raw response
            return response.json();
        })
        .then(data => {
            if (data.game_html) {
                console.log('Local game returned!');
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    startLocalGame(data['player1'], data['player2'], data['main_user']);
                else
                console.log("Error: Canvas not found");

            } else {
                console.log('Response: ', data);
                console.error('Failed to fetch the local game:', data.error);
            }
        })
        .catch(error => {
            console.error('Catch error loading local game: ', error);
        });
    }
}

export const tournamentGameAIstart = () => {
    const tourId = localStorage.getItem("currentTournamentId");
    let args = {
        tournament: true,
        tournamentId: tourId,
    }
    gameAI(args);
}

export const gameAI = (args) => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        let tournament = null;
        console.log("Playing AI game. Tournament mode:", args?.tournament); 
        if (args?.tournament == true) {
            console.log("This is a tournament game! in gameAI");
            console.log(args.tournamentId);
            tournament = {tournament: true, id: args.tournamentId};
            console.log(tournament.id);
            // clearIntervalIDGame();
            // const savedState = localStorage.getItem("gameState");
        }
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/play/", {
            method: "POST",
            body: JSON.stringify({
                'second-player': "AI",  // Stringify the body data
            }),
            headers: {"Content-Type": "application/json"},
        })
        .then(response => {
            console.log('Raw response:', response);  // Add this line to inspect the raw response
            return response.json();
        })
        .then(data => {
            if (data.game_html) {
                console.log('AI game returned!');
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas) {
                    const button = document.getElementById('play-again');
                    if (button && !tournament) {
                        button.setAttribute("data-route", "/play-ai");
                    } else if (button && tournament) {
                        button.textContent = "Quit Tournament";
                        button.removeAttribute("data-route");
                        button.addEventListener('click', () => {
                            // handle give up!! quit?
                            clearIntervalIDGame();
                            quitTournament();
                            // loadBracketTournamentPage(tournament.id);
                        });
                    }
                    startAIGame(data['player1'], data['player2'], data['main_user'], tournament);
                } else {
                    console.log("Error: Canvas not found");
                }
            } else {
                console.log('Response: ', data);
                console.error('Failed to fetch the local game:', data.error);
            }
        })
        .catch(error => {
            console.error('Catch error loading local game: ', error);
        });
    }
} 

export const playOnline = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log('Loading online game...')
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/remote/play/", {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {
            if (data.game_html) {
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    startGame();
                else
                    console.log("Error: Canvas not found");
            } else {
                console.log('Response: ', data);
                console.error('Failed to load remote game:', data.error);
            }
        })
        .catch(error => {
            console.error('Catch error loading remote game: ', error);
            if (error == "No access token.")
                navigateTo('/login');
        });
    }
    // makeAuthenticatedRequest() // to POST the results
} 

export function play3D() {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Navigating to /play-local/game");
    }
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = ''; // Clear previous content
    makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/play/", {
        method: "POST",
        body: JSON.stringify({
            'second-player': 'somename',  // Stringify the body data
        }),
        headers: {"Content-Type": "application/json"},
    })
    .then(response => {
        console.log('Raw response:', response);  // Add this line to inspect the raw response
        return response.json();
    })
    .then(data => {
        if (data.game_html) {
            console.log('3D game returned!');

            // start3DLocalGame(data['player1'], data['player2'], data['main_user']);
            start3DLocalGame('player1', '@42nzhuzhle', 2);
            // start3DAIGame(localStorage.getItem('username'));


        } else {
            console.log('Response: ', data);
            console.error('Failed to fetch the local game:', data.error);
        }
    })
    .catch(error => {
        console.error('Catch error loading local game: ', error);
    });
 
}