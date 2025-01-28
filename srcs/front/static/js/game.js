import { makeAuthenticatedRequest } from "./login.js";
import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { startLocalGame } from "./localGame.js"; 

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
        });
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
        
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/play/", {
            method: "POST",
            body: JSON.stringify({
                'second-player': secondPlayerName,  // Stringify the body data
            }),
        })
        .then(response => {
            console.log('Raw response:', response);  // Add this line to inspect the raw response
            return response.json();
        })
        .then(data => {
            if (data.game_html) {
                console.log('Local game returned!');
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("gameCanvas");
                if (canvas)
                    startLocalGame(data['player1'], data['player2']);
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
        // const contentArea = document.getElementById('content-area');
        // contentArea.innerHTML = '';
        // const heading = document.createElement('h2');
        // heading.textContent = 'Here will be the game board'
        // contentArea.appendChild(heading);
        // console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() //.py to POST the results
}

export const playAI = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '';
        const heading = document.createElement('h2');
        heading.textContent = 'Here will be the game board'
        contentArea.appendChild(heading);
        console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() // to POST the results
} 

export const playOnline = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '';
        const heading = document.createElement('h2');
        heading.textContent = 'Here will be the game board'
        contentArea.appendChild(heading);
        console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() // to POST the results
} 
