import { makeAuthenticatedRequest } from "./login.js";
import { startAIGame, clearIntervalIDGame } from "./AIGame.js";
import { navigateTo, checkPermission, drawHeader } from "./main.js"
import { startLocalGame } from "./localGame.js";
import { startGame, cleanRemote } from "./remoteGame.js"; 
import { start3DAIGame, start3DLocalGame, start3DRemoteGame } from "./3DGame.js";
import { loadBracketTournamentPage, quitTournament } from "./tournament.js";


const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const gamePort = window.env.GAME_PORT;

let Enable3D = false;

export const playLocal = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log('Loading get second name page...')
        drawHeader('main').then(() => {
          return  makeAuthenticatedRequest(baseUrl + gamePort + "/api/game/local/get-name/", {
                method: "GET",
                credentials: "include",
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
        })
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

    // Enable3D = localStorage.getItem("3D-option");
    // console.log(`Play AI, Enable 3D: ${Enable3D}`)

    if (!checkPermission) {
        navigateTo('/login');
    // } else if (Enable3D === "true") {
    //     //HERE SOMETHING WITH LANGUAGES
    //     // const contentArea = document.getElementById('content-area');
    //     // contentArea.innerHTML = ''; // Clear previous content
    //     // start3DAIGame(localStorage.getItem('username'));
    //     play3D();
    
    } else {
        console.log("Playing AI game. Tournament mode:", args?.tournament); 
        if (args?.tournament === "true") {
            console.log("This is a tournament game! in playAI");
            gameAI(args);
        } else {
            console.log('Loading get difficulty page...')
            drawHeader('main').then(() => {
              return  makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/ai/get-difficulty", {
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
            })
            .catch(error => {
                console.error('Catch error fetching difficulty page: ', error);
                if (error == "No access token.")
                    navigateTo('/login');
            });
        }
    }
} 

export async function gameLocal () {
    Enable3D = localStorage.getItem("3D-option");
    console.log(`Enable 3D: ${Enable3D}`)
    // Enable3D = localStorage.getItem("3D-option") === "true";
    // "3d-option": Enable3D ? "True" : "False",
    const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION

    const username = await getUsername();
    if (!username) {
        navigateTo('/logout');
        return;
    }
    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Navigating to /game-local");

    // Retrieve the second player's name from the form
        const playerNameInput = document.getElementById("player-name");
        const secondPlayerName = playerNameInput ? playerNameInput.value.trim() : null;
        console.log(`Stored second player name: ${secondPlayerName}`);
        console.log(`Username: ${localStorage.getItem('username')}`);
        if (secondPlayerName === username) {
            alert("Both names cannot be equal. Set another name");
            navigateTo('/play-local', true);
            return ;
        } else if (!secondPlayerName) {
            alert("Set second player's name");
            navigateTo('/play-local', true);
            return ;
        }
        
        makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/local/play/", {
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
            if (data.game_html && Enable3D === "false") {
                console.log('Local game returned!');
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    startLocalGame(data['player1'], data['player2'], data['main_user']);
                else
                console.log("Error: Canvas not found");

            } else if (Enable3D === "true") {
                //HERE SOMETHING WITH LANGUAGES
                
                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = ''; // Clear previous content
                start3DLocalGame(data['player1'], data['player2'], data['main_user'], dictionary);
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


export const gameAI = (args) => {
    // const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION

    Enable3D = localStorage.getItem("3D-option");

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
        if (Enable3D === "true")
            play3D(tournament);
        else {
            makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/local/play/", {
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
                if (data.game_html)
                    console.log("html here");
                if (Enable3D === "false")
                    console.log("3d false");
                if (data.game_html && Enable3D === "false") {
                    console.log('AI game returned!');
                    document.getElementById('content-area').innerHTML = data.game_html;
                    const canvas = document.getElementById("newGameCanvas");
                    if (canvas) {
                        const button = document.getElementById('play-again');
                        if (button && !tournament) {
                            button.setAttribute("data-route", "/play-ai");
                            button.setAttribute("replace-url", true);
                        } else if (button && tournament) {
                            button.textContent = "Quit Tournament";
                            button.setAttribute("data-route", "/quit-tournament");
                            button.setAttribute("replace-url", true);
                            // button.removeAttribute("data-route");
                            // button.addEventListener('click', () => {
                            //     // handle give up!! quit?
                            //     clearIntervalIDGame();
                            //     quitTournament();
                            //     // loadBracketTournamentPage(tournament.id);
                            // });
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
        };
    }
} 

export async function playOnline () {

    Enable3D = localStorage.getItem("3D-option");
    console.log(`Enable 3D: ${Enable3D}`)
	// Enable3D = "false";
    const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        // console.log('Loading online game...')
        drawHeader('main').then(() => {
          return  makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/remote/play/", {
                method: "GET",
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.game_html && Enable3D === "false") {
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    startGame();
                else
                    console.log("Error: Canvas not found");
            } else if (Enable3D === "true") {
                    //HERE SOMETHING WITH LANGUAGES
                // start3DOnlineGame(localStorage.getItem('username'));

                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = ''; // Clear previous content
                start3DRemoteGame(dictionary);
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

export async function play3D(tour) {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Navigating to /play-ai/3D");
    }
    const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = ''; // Clear previous content
    
    // console.log('3D game returned! Dictionary:');
    // console.log(dictionary);
    // start3DLocalGame(data['player1'], data['player2'], data['main_user']);
    // start3DLocalGame('player1', '@42nzhuzhle', 2);
    start3DAIGame(localStorage.getItem('username'), dictionary, tour);

}

async function getDictFor3DGame() {
    const response = await makeAuthenticatedRequest(baseUrl + gamePort+ "/api/get-game-dict", {
        method: "GET",
        credentials: "include"
    })
    .catch(error => {
        console.error('Error fetching game dictionary: ', error);
    });

    const data = await response.json();
    return data.dict;
}

async function getUsername() {
    try {
        const response = await makeAuthenticatedRequest(baseUrl + gamePort + "/api/get-username", {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        return data.status === "success" ? data.username : null;
    } catch (error) {
        console.error("Error fetching username:", error); // Improved error logging
        return null;
    }
}


export async function restartOnline() {
    cleanRemote();
    playOnline();
}