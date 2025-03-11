import { makeAuthenticatedRequest } from "./login.js";
import { startAIGame, clearIntervalIDGame } from "./AIGame.js";
import { navigateTo, checkPermission, drawHeader } from "./main.js"
import { startLocalGame } from "./localGame.js";
import { startGame, createRoomId } from "./remoteGame.js"; 
import { start3DAIGame, start3DLocalGame, start3DRemoteGame } from "./3DLocalGame.js";

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const gamePort = window.env.GAME_PORT;

let Enable3D = false;
let isCreator = false;
let roomId;

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
                    console.log('Failed to fetch second player:', data.error);
                }
            })
            .catch(error => {
                console.log('Catch error fetching second player page: ', error);
                if (error == "No access token.")
                    navigateTo('/login');
            });
        })
    }
} 

export const playAI = async (args) => {
    clearIntervalIDGame();
    const savedState = localStorage.getItem("gameState");
    if (savedState)
        console.log("the state is here!! we need to remove it");
    else
        console.log("the state is not here!!");
    localStorage.removeItem("gameState");

    Enable3D = getOrInitialize3DOption();
    console.log(`Play AI, Enable 3D: ${Enable3D}`)

    if (!checkPermission) {
        navigateTo('/login');
    } else if (Enable3D === "true") {
        //HERE SOMETHING WITH LANGUAGES
        // const contentArea = document.getElementById('content-area');
        // contentArea.innerHTML = ''; // Clear previous content
        // start3DAIGame(localStorage.getItem('username'));
        play3D();
    
    } else {
        console.log("Playing AI game. Tournament mode:", args?.tournament); 
        if (args?.tournament === "true") {
            console.log("This is a tournament game! in playAI");
            await gameAI(args);
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
                        console.log('Failed to fetch difficulty:', data.error);
                    }
                })
            })
            .catch(error => {
                console.log('Catch error fetching difficulty page: ', error);
                if (error == "No access token.")
                    navigateTo('/login');
            });
        }
    }
} 

export async function gameLocal () {
    Enable3D = getOrInitialize3DOption();
    console.log(`Enable 3D: ${Enable3D}`)
    const dictionary = await getDictFor3DGame();

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
        .then(async data => {
            if (data.game_html && Enable3D === "false") {
                console.log('Local game returned!');
                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    await startLocalGame(data['player1'], data['player2'], data['main_user'], dictionary);
                else
                console.log("Error: Canvas not found");

            } else if (Enable3D === "true") {
                //HERE SOMETHING WITH LANGUAGES
                
                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = ''; // Clear previous content
                start3DLocalGame(data['player1'], data['player2'], data['main_user'], dictionary);
            } else {
                console.log('Response: ', data);
                console.log('Failed to fetch the local game:', data.error);
            }
        })
        .catch(error => {
            console.log('Catch error loading local game: ', error);
        });
    }
}


// export const gameAI = async (args) => {
//     const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION

//     Enable3D = localStorage.getItem("3D-option");
export const gameAI = async (args) => {
    Enable3D = getOrInitialize3DOption();
    const dictionary = await getDictFor3DGame();

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
        .then(async data => {
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
                    await startAIGame(data['player1'], data['player2'], data['main_user'], tournament, dictionary);
     
                } else {
                    console.log("Error: Canvas not found");
                }
            } else {
                console.log('Response: ', data);
                console.log('Failed to fetch the local game:', data.error);
            }
        })
        .catch(error => {
            console.log('Catch error loading local game: ', error);
        });
    }
} 

export async function playOnline () {

    Enable3D = getOrInitialize3DOption();
    console.log(`Enable 3D: ${Enable3D}`)
    const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log('Loading online game...')
        drawHeader('main').then(() => {
          return  makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/remote/play/", {
                method: "GET",
            })
        })
        .then(response => response.json())
        .then(async data => {
            if (data.game_html && Enable3D === "false") {

                document.getElementById('content-area').innerHTML = data.game_html;
                const canvas = document.getElementById("newGameCanvas");
                if (canvas)
                    startGame(roomId, isCreator, dictionary);
                else
                    console.log("Error: Canvas not found");
            } else if (Enable3D === "true") {
                //HERE SOMETHING WITH LANGUAGES
                // start3DOnlineGame(localStorage.getItem('username'));
                
                const contentArea = document.getElementById('content-area');
                contentArea.innerHTML = ''; // Clear previous content
                start3DRemoteGame(dictionary, roomId, isCreator);
            } else {
                console.log('Response: ', data);
                console.log('Failed to load remote game:', data.error);
            }
        })
        .catch(error => {
            console.log('Catch error loading remote game: ', error);
            if (error == "No access token.")
                navigateTo('/login');
        });
    }
} 


export async function loadRemoteHome() {
	if (!checkPermission)
		navigateTo('/login');
    else 
	{
    	const dictionary = await getDictFor3DGame(); //DICTIONARY FUNCTION
        drawHeader('main').then(() => {
          return  makeAuthenticatedRequest(baseUrl + gamePort+ "/api/game/remote/home/", {
                method: "GET",
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.game_html)
                document.getElementById('content-area').innerHTML = data.game_html;
            else
                console.error('Failed to load home remote game:', data.error);
//<<<<<<< HEAD
			document.getElementById("join-online")?.addEventListener("click", () => {
				const inputElement = document.getElementById("game-id-input");
				const inputValue = inputElement ? inputElement.value.trim() : null;

				if (inputValue)
				{
					isCreator = false;
					roomId = (isCreator | 0) + inputValue.toString();
					navigateTo("/play-online");
				}
				else
					alert ("bad id error here")
					//alert(`${dictionary['bad_id']}`);
			});

			document.getElementById("create-online")?.addEventListener("click", async () => {
				let roomIdgen = await createRoomId();
				isCreator = true;
				roomId = (isCreator | 0) + roomIdgen.toString();
				navigateTo("/play-online");
			});
		})
//=======
//            
//            console.log("Estamos aquiiiii!!!!!!!");
//            document.getElementById("join-online")?.addEventListener("click", () => {
//                const inputElement = document.getElementById("game-id-input");
//                const inputValue = inputElement ? inputElement.value.trim() : null;
//                console.warn(`Stored id inputed: ${inputValue}`);
//                
//                // Si se ha introducido un ID, navega a la ruta deseada usando navigateTo()
//                if (inputValue) {
//                    roomId = inputValue;
//                    isCreator = false;
//                    navigateTo("/play-online");
//                } else {
//                    alert("No se ha introducido un ID válido");
//                }
//            });
//            
//            document.getElementById("create-online")?.addEventListener("click", async () => {
//                let roomIdgen = await createRoomId();
//                console.warn(`Room created with ID: ${roomIdgen}`);
//                
//                // Navega a la ruta correspondiente usando el roomId generado
//                roomId = roomIdgen;
//                isCreator = true;
//                navigateTo("/play-online");
//            });
//
//        })
//>>>>>>> main
        .catch(error => {
            console.error('Catch error loading home remote game: ', error);
            if (error == "No access token.")
                navigateTo('/login');
        });
    }

}

export async function play3D() {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        console.log("Navigating to /play-ai/3D");
    }
    const dictionary = await getDictFor3DGame();
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = ''; // Clear previous content
    
    console.log('3D game returned! Dictionary:');
    console.log(dictionary);
    // start3DLocalGame(data['player1'], data['player2'], data['main_user']);
    // start3DLocalGame('player1', '@42nzhuzhle', 2);
    const username = await getUsername();
    if (!username) {
        navigateTo('/logout');
        return;
    }
    start3DAIGame(username, dictionary);
}

export async function getDictFor3DGame() {
    const response = await makeAuthenticatedRequest(baseUrl + gamePort+ "/api/get-game-dict", {
        method: "GET",
        credentials: "include"
    })
    .catch(error => {
        console.log('Error fetching game dictionary: ', error);
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
        return null;
    }
}

export function getOrInitialize3DOption() {
    let Enable3D = localStorage.getItem("3D-option");

    if (Enable3D === null || (Enable3D !== 'false' && Enable3D !== 'true')) {
        localStorage.setItem("3D-option", "false");
        Enable3D = "false";
    }
    return Enable3D;
}
