
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { saveScore } from "./localGame.js";
import * as THREE from "three";
import { Player, AIPlayer, AIController, OnlinePlayer } from './3DPlayer.js';
import { Ball, OnlineBall } from './3DBall.js';
import { SceneText, RemoteSceneText, textParams, textWinner } from './3DText.js';
import { AmbientLight, DirectionalLight , Vector3} from 'three'
import { drawHeader } from "./main.js";


//----------------------------------------------------------------------------//
//-------------------- VARIABLES INITIALIZATION ------------------------------//
//----------------------------------------------------------------------------//

var gamePort = window.env.GAME_PORT;
var host = window.env.HOST;
 
let renderer, scene, camera, player, opponent, waiting = false;
let limits, planeGeo, planeMat, plane, controls, ai, loader, countdownText;
let player1, player2, ball, gameLoopId, targetBallX, targetBallY; // if the main user is player 1 or 2
let text, mainUser, lights, dict, socket = null;
let ifAI = false;
let gameStarted = false;
let gameEnded = false;
let pause = false;

const clock = new THREE.Clock();
clock.start();
const ray = new THREE.Raycaster();
const cursor = new THREE.Vector2(0,0);

const ambientLight = new AmbientLight(0xffffff, 1)
const dirLight = new DirectionalLight(0xffffff, 1)

export const field = {
    x: 15,
    y: 20,
    width: 0.5,
    height: 2,
    // depth: limits.y * 2,
    radius: 5,
    seg: 0.25
}

export const params = {
	planeColor: 0xDDDDFF, //0x9999DD, // 0x555577, //0xb994ff, //0x9b71ea, //0x6966ff,
	fogColor: 0x000033,//0x000022, //0x9e7aff,
	fogNear: 25,
	fogFar: 150,
    textY:  20,
    buttonColor: 0x9400FF,
    winnerColor: 0x22FFFF,//0x9400FF,//0xF5F045,//0xFF00FF,
    // winnerPosAI: new THREE.Vector3(0, 20, 1.5),
    // winnerPosPlayers: new THREE.Vector3(0, 2, field.x + 3),
}

const   size = {
    width: window.innerWidth,
    height: window.innerHeight,
}

//---------------------------------------------------------------------------------//
// ------------------ LOCAL GAME WITH ANOTHER PLAYER FUNCTIONS ------------------- //
//---------------------------------------------------------------------------------//

// Start game function
export async function start3DLocalGame(playerName1, playerName2, mainUserNmb, dict) {
    // Set up scene
    drawHeader(1)
    const contentArea = document.getElementById('content-area');
    contentArea.style.padding = 0;
    dict = dict;
    window.gameDict = dict;
    gameStarted = false;
    await setupScene();
    text = new SceneText(scene, dict, 0, -Math.PI / 2, 0);
    await text.createText();
    // text.group.rotation.y = text.rotation;
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(-39.5, 22.5, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    mainUser = mainUserNmb;
    await createLights(-20);
    
    await setupField();
    controls.target.set(0, 7, 0);
    // scene.lights[dirLight].position.x *= -1;
    console.log('Starting local game...');

    player1 = new Player(dict, limits, scene, -1, playerName1, new THREE.Vector3(0, 0, -field.y + 2), -0.1, -0.5, 0);
    console.log(`player1: ${field.y}`)
    player2 = new Player(dict, limits, scene, 1, playerName2, new THREE.Vector3(0, 0, field.y - 2), -0.1, -0.5, 0);
    ball = new Ball(dict, scene, limits, [player1, player2], false);
    setupEvents();
    setupControls();
    // ROTATE THE BUTTON
    // gameStarted = true;
    animateLocal();

}

// Event listeners for player controls
export function setupControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
        if (e.code === "Space" && !gameStarted && !gameEnded) {
            console.log("Spacebar pressed! Starting game...");
            // if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
        }
        if (e.code === "Space" && !gameStarted && gameEnded) {
            console.log("Spacebar pressed! Try again...");
            // if (gameStarted) return; // Prevent multiple starts
            restart();
            // resetTeam();
            // gameEnded = false;
            // text.tryAgain.visible = false;
            // text.winnerMessage.visible = false;
            // text.start.visible = true; // Hide the button
            
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player1.up = false;
        if (e.key === "s") player1.down = false;
        if (e.key === "ArrowUp") player2.up = false;
        if (e.key === "ArrowDown") player2.down = false;
    });
}

// Game loop
async function animateLocal() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.1)
    
    if (gameStarted && !pause) {
        ball.update(dt);
        player1.move();
        player2.move();
    } else {
        ball.resetPos();
        player1.resetPos();
        player2.resetPos();
    }

    // console.log(ball.mesh.position);
    // controls.target.set(controls.target.x, controls.target.y + 0.01, controls.target.z);
    controls.update();  // Required if you have damping enabled
    // console.log(`camera ${camera.position.x}x${camera.position.y}x${camera.position.z}`)
    // console.log(`target ${controls.target.x}x${controls.target.y}x${controls.target.z}`)
    // Update scene and render 
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateLocal);
}

//---------------------------------------------------------------------------------//
// ------------------ LOCAL GAME WITH ANOTHER PLAYER FUNCTIONS ------------------- //
//---------------------------------------------------------------------------------//

// Start game function
export async function start3DRemoteGame(dict) {
    // Set up scene
    drawHeader(1)
    const contentArea = document.getElementById('content-area');
    contentArea.style.padding = 0;
    dict = dict;
    window.gameDict = dict;
    gameStarted = false;
    waiting = false;
    await setupScene();
    text = new RemoteSceneText(scene, dict, 0, -Math.PI / 2, -Math.PI / 2);
    await text.createText();
    // text.group.rotation.y = text.rotation;
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(-39.5, 22.5, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    // mainUser = mainUserNmb;
    await createLights(-20);
    
    await setupField();
    // controls.target.set(0, 7, 0);
    // scene.lights[dirLight].position.x *= -1;
    console.log('Starting remote 3D game...');

    player1 = new OnlinePlayer(dict, limits, scene, -1, "", new THREE.Vector3(0, 0, -field.y + 2), -0.1, -0.5, 0);
    console.log(`player1: ${field.y}`)
    player2 = new OnlinePlayer(dict, limits, scene, 1, "", new THREE.Vector3(0, 0, field.y - 2), -0.1, -0.5, 0);
    // ball = new OnlineBall(dict, scene, limits, [player1, player2], false);
    // targetBallX = ball.mesh.position.z;
    // targetBallY = ball.mesh.position.x;
    // initializeWebSocket();
    setupRemoteEvents();
    

    // ROTATE THE BUTTON
    // gameStarted = true;
    animateRemote();

}

async function setupRemoteEvents() {
    ball.addEventListener("remotefinish", (e) => {
        // handleEndGame(e.message);
        // if (!player1 || !player2) return;
        // saveScore(player1.score, player2.score, mainUser);

        console.log('goal!! player name', e.message);
    })

    ball.addEventListener("remotepause", (e) => {
        console.log('goal!! pause');
        // pause = true;
        // // HERE SINCRONIZE WITH BACKEND
        // showCountdown(() => {
        //     console.log("Game resuming!");
        //     ball.resetVelocity(); // Randomize direction
        //     console.log(`Velocity reset to x - ${ball.velocity.x}, z - ${ball.velocity.z}`);
        //     pause = false;
        //     // this.dispatchEvent({ type: 'airestart'});
        //     // this.isPaused = false;
        // });
        // pause = false;
        // console.log('goal!! pause');
    })

    window.addEventListener("keydown", (e) => {
            if (e.code === "Space" && !gameStarted && !gameEnded) {
            console.log("Spacebar pressed! Starting game...");
            // if (gameStarted) return; // Prevent multiple starts
            waiting = true;
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
            // initializeWebSocket();
            // WAITING TEXT HERE

        }
        if (e.code === "Space" && !gameStarted && gameEnded) {
            console.log("Spacebar pressed! Try again...");
            // if (gameStarted) return; // Prevent multiple starts
            // restartOnline(); //WRITE THIS FUNCTION
         
        }
    });
    ball.addEventListener("onrestart", (e) => {
        // console.log('goal!!', e.message);
        pause = false;

        // console.log('goal!! restart');
    })
    
    window.addEventListener("click", (event) => { buttonsManager(event) });
}

// Event listeners for player controls
export function setupRemoteControls(player) {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player.up = true;
        if (e.key === "s") player.down = true;
        if (e.key === "ArrowUp") player.up = true;
        if (e.key === "ArrowDown") player.down = true;
        
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player.up = false;
        if (e.key === "s") player.down = false;
        if (e.key === "ArrowUp") player.up = false;
        if (e.key === "ArrowDown") player.down = false;
    });
}


//async function initializeWebSocket(roomId) {
async function initializeWebSocket(roomId = 123) {
    //const roomID = new URLSearchParams(window.location.search).get("room") || "default";
    // const roomId = 123;
    let retries = 0;

    let token = localStorage.getItem("access_token");
    if (!token)
    {   
        try {
            token = await refreshAccessToken();
        } catch (err) {
          console.error("Failed to refresh token", err);
          handleLogout();
        }
        console.warn("No access token found");
        return ;
    }
    if (!socket)
    {
        socket = new WebSocket(`ws://${host}:${gamePort}/ws/G/${roomId}/?token=${token}`);
        console.log("Socket created!");
    }
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
        alert("Unable to connect to the server. Please check your connection.");
    };
    socket.onclose = async (event) => {
        console.log("WebSocket closed with code:", event.code);

        console.warn("WebSocket connection closed. Retrying...");
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
        } else if (retries++ <= 5)
            setTimeout(initializeWebSocket, 1000);
    };

    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "role":
                // handleRoleAssignment(data.role);
                scaleGame(data);
                break;
            case "players":
                player1.name = data.p1;
                player2.name = data.p2;

                socket.send(JSON.stringify({"type": "ready"}))
                break;
            case "status":
                if (data.wait)
                {
                    if (data.countdown != 4)
                        displayCountdown();
                    else
                        await readySteadyGo(data.countdown - 2);
                }
                else
                {
                    console.log("let's start the game!");
                    setupControls(player, opponent)
                    gameLoop();
                }
                break;
            case "update":
                if (data.players)
                {
                    let pl1 = data["players"]["player1"]["y"] * backFactor["y"];
                    let pl2 = data["players"]["player2"]["y"] * backFactor["y"];
                    //console.log(`canvasH: ${canvas.height}\np1Y: ${pl1}\np2Y: ${pl2}`)
                    //console.log(`p1 Y: ${pl1} score: ${data['scores']['player1']}\n p2 Y: ${pl2} score: ${data['scores']['player2']}`);
                    if (player.role == "player1")
                    {
                        player.update(pl1, data["scores"]["player1"]);
                        opponent.update(pl2, data["scores"]["player2"]);
                    }
                    else if (player.role == "player2") 
                    {
                        player.update(pl2, data["scores"]["player2"]);
                        opponent.update(pl1, data["scores"]["player1"]);
                    }
                }
                if (data.ball) {
                    targetBallX = data.ball.x * backFactor["x"];
                    targetBallY = data.ball.y * backFactor["y"];
                }
                break ;
            case "endgame":
                handleEndgame(data);
                break;
            default:
                console.warn("Unhandled message type:", data.type);
        }
    };
}

// function scaleGame(data)
// {
// 	handleRoleAssignment(data.role);
// 	player.width = canvas.width * (data.padW / data.canvasX);
// 	opponent.width = player.width;
// 	player.height = canvas.height * (data.padH / data.canvasY);
// 	opponent.height = player.height;
// 	if (player.x != 0)
// 		player.x = canvas.width - player.width;
// 	//console.log("FRONT 2 width: " + player.width + " height: " + player.height);
// 	backFactor["x"] = canvas.width / data.canvasX;
// 	backFactor["y"] = canvas.height / data.canvasY;
// 	player.backFactor = backFactor["y"];
// 	opponent.backFactor = backFactor["y"];
// }

function handleRoleAssignment(role) {
	console.log("Hi! I'm " + role);
	if (role === "player1") {
		// player1. ;
        // opponent = new OnlinePlayer(dict, limits, scene, 1, playerName2 = "opponent", new THREE.Vector3(0, 0, field.y - 2), -0.1, -0.5, 0);
        // ball = new OnlineBall(dict, scene, limits, [player, opponent], false);
        // mainUser = 1;
        setupRemoteControls(player1);
	} else if (role === "player2") {
        // opponent = new OnlinePlayer(dict, limits, scene, -1, playerName1 = "opponent", new THREE.Vector3(0, 0, -field.y + 2), -0.1, -0.5, 0);
        // player = new OnlinePlayer(dict, limits, scene, 1, playerName2 = "player", new THREE.Vector3(0, 0, field.y - 2), -0.1, -0.5, 0);
        // ball = new OnlineBall(dict, scene, limits, [opponent, player], false);
        setupRemoteControls(player2);
	}

    // targetBallX = ball.mesh.position.z;
    // targetBallY = ball.mesh.position.x;
    // setupEvents(); //DO REMOTE EVENTS??? 
}



// Game loop
async function animateRemote() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.1)
    
    // if (gameStarted && !pause) {
    //     ball.update(dt);
    //     player1.move();
    //     player2.move();
    // } else {
    //     ball.resetPos();
    //     player1.resetPos();
    //     player2.resetPos();
    // }

    // HERE WHILE WAITING MOVE THE CAMERA
    
    // if (waiting && )
    // if (waiting && controls.target.x == 0) {
    //     while (controls.target.y > 7)
    //         controls.target.set(controls.target.x, controls.target.y - 0.01, controls.target.z);
    // }

    // console.log(ball.mesh.position);
    // controls.target.set(controls.target.x, controls.target.y + 0.01, controls.target.z);
    controls.update();  // Required if you have damping enabled
    // console.log(`camera ${camera.position.x}x${camera.position.y}x${camera.position.z}`)
    // console.log(`target ${controls.target.x}x${controls.target.y}x${controls.target.z}`)
    // Update scene and render 
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateLocal);
}

//--------------------------------------------------------------------//
// -------------------- GAME WITH AI FUNCTIONS ---------------------- //
//--------------------------------------------------------------------//

export async function start3DAIGame(playerName2, dict) {
    
    // ifAI = true;
    drawHeader('3d');
    const contentArea = document.getElementById('content-area');
    contentArea.style.padding = 0;
    dict = dict;
    window.gameDict = dict;
    // console.log(dict);
    // contentArea.style.padding = 0;
    gameStarted = false;
    await setupScene();
    text = new SceneText(scene, dict);
    await text.createText();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    console.log(`Inicially ${playerName2}`);
    await createLights(20);
    await setupField();
    player2 = new AIPlayer(dict, limits, scene, 1, playerName2, new THREE.Vector3(0, 0, field.y - 2), -0.1);
    player1 = new AIPlayer(dict, limits, scene, -1, dict['enemy'], new THREE.Vector3(0, 0, -field.y + 2), -0.1);
    ball = new Ball(dict, scene, limits, [player1, player2], true);
    ai = new AIController(player1, ball, limits);
    setupEvents();
    setupAIControls();

    animateAI();

}

function setupAIControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player2.down = true;
        if (e.key === "ArrowRight") player2.up = true;
        if (e.code === "Space" && !gameStarted && !gameEnded) {
            // console.log("Spacebar pressed! Starting game...");
            // if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
        }
        if (e.code === "Space" && !gameStarted && gameEnded) {
            // console.log("Spacebar pressed! Try again...");
            // if (gameStarted) return; // Prevent multiple starts
            // resetTeam(); // resets the ball and players;
            // gameEnded = false;
            // text.tryAgain.visible = false;
            // text.winnerMessage.visible = false;
            // text.start.visible = true; // Hide the button
            restart();
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") player2.down = false;
        if (e.key === "ArrowRight") player2.up = false;
    });
}

// AI Game loop
async function animateAI() {
   
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    const dt = Math.min(deltaTime, 0.05)
    
    if (gameStarted && !pause) {
        ball.update(dt, pause);
        ai.update(elapsedTime);
        player2.move();

    } else {
        ball.resetPos();
        player1.resetPos();
        player2.resetPos();
    }

    // console.log(`${ball.mesh.position.x}`);
    // controls.update();  // Required if you have damping enabled
    // console.log(`camera ${camera.position.x}x${camera.position.y}x${camera.position.z}`)
   
    // Update scene and render
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateAI);
}

//--------------------------------------------------------------------//
// ---------------------- COMMON FUNCTIONS -------------------------- //
//--------------------------------------------------------------------//

async function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(params.fogColor);
    scene.fog = new THREE.Fog(params.fogColor, params.fogNear, params.fogFar);
}

async function createLights(posX) {

    dirLight.position.set(posX, 20, 20)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    dirLight.shadow.camera.top = 30
    dirLight.shadow.camera.bottom = -30
    dirLight.shadow.camera.left = -30
    dirLight.shadow.camera.right = 30
    dirLight.shadow.radius = 10
    dirLight.shadow.blurSamples = 20

    lights = [dirLight, ambientLight]
}

async function setupField() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(size.width, size.height);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.type = THREE.VSMShadowMap; //THREE.PCFSoftShadowMap; // Soft shadows
    document.getElementById('content-area').appendChild(renderer.domElement);
    handleResize();
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true
    scene.add(...lights);
    
    limits = new THREE.Vector2(field.x, field.y);
    planeGeo = new THREE.PlaneGeometry(
        limits.x * 20,
        limits.y * 20,
        limits.x * 20,
        limits.y * 20,
    );

    planeGeo.rotateX(-Math.PI * 0.5);
    planeMat = new THREE.MeshStandardMaterial({ 
        color: params.planeColor,
    });
    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.receiveShadow = true;
    scene.add(plane)

    const boundGeo = new RoundedBoxGeometry(field.width, field.height, limits.y * 2, field.radius, field.seg);
    const boundMat = new THREE.MeshPhongMaterial({
        color: params.planeColor,
        specular: 0xFFFFFF, 
        shininess: 100 
    });
    const leftBound = new THREE.Mesh(boundGeo, boundMat);
    leftBound.position.x = -limits.x - field.width / 2;
    leftBound.position.y = field.height;
    leftBound.castShadow = true;
    leftBound.receiveShadow = true;
    const rightBound = leftBound.clone();
    rightBound.position.x *= -1;
    // console.log(`Left bound is: ${leftBound.position.x}, Right bound is: ${rightBound.position.x}`)
    scene.add(leftBound, rightBound);

    await createSky();
}

async function setupEvents() {
    ball.addEventListener("aifinish", (e) => {
        handleEndGame(e.message);
        // console.log('goal!! player name', e.message);
    })

    ball.addEventListener("localfinish", (e) => {
        handleEndGame(e.message);
        if (!player1 || !player2) return;
        saveScore(player1.score, player2.score, mainUser);

        // console.log('goal!! player name', e.message);
    })

    ball.addEventListener("aipause", (e) => {
        console.log('goal!! pause');
        pause = true;
        // console.log(dict);
        showCountdown(() => {
            console.log("Game resuming!");
            ball.resetVelocity(); // Randomize direction
            console.log(`Velocity reset to x - ${ball.velocity.x}, z - ${ball.velocity.z}`);
            pause = false;
            // this.dispatchEvent({ type: 'airestart'});
            // this.isPaused = false;
        });
        // pause = false;
        // console.log('goal!! pause');
    })

    ball.addEventListener("airestart", (e) => {
        // console.log('goal!!', e.message);
        pause = false;

        // console.log('goal!! restart');
    })
    
    window.addEventListener("click", (event) => { buttonsManager(event) });
}

async function buttonsManager(event) {
    if (gameStarted) return; // Ignore clicks after the game starts
    if (!text || !text.button || !text.start || !text.tryAgain) {
        console.log("One or more 3D buttons are not initialized.");
        return;
    }
    // Convert mouse position to normalized device coordinates (-1 to +1)
    // cursor.x = (event.clientX / window.innerWidth) * 2 - 1;
    // cursor.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const rect = renderer.domElement.getBoundingClientRect();
    // Calculate normalized coordinates relative to the canvas
    cursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    cursor.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to check for intersections
    ray.setFromCamera(cursor, camera);
    const intersects = ray.intersectObject(text.button);
    // rayStart.setFromCamera(cursor, camera);
    const intersectsStart = ray.intersectObject(text.start);
    const intersectsTryAgain = ray.intersectObject(text.tryAgain);

    if ((intersects.length > 0 || intersectsStart.length > 0) && !gameEnded ) {
        console.log("3D Start Button Clicked!");
        gameStarted = true;
        text.start.visible = false; // Hide the button
        text.button.visible = false;
    } else if ((intersects.length > 0 || intersectsTryAgain.length > 0) && gameEnded ) {
        console.log("3D TryAgain Button Clicked!");
        restart();
    }
}

function showCountdown(callback) {
    let count = 2;
    text.updateGeometry(text.countdownText, "3", textWinner);
    text.countdownText.visible = true;
    const interval = setInterval((dict) => {
        // console.log(window.gameDict);
        if (count === 0) {
            text.updateGeometry(text.countdownText, window.gameDict['go'], textWinner);
        } else if (count < 0) {
            clearInterval(interval);
            text.countdownText.visible = false; // Hide instead of remove
            callback(); // Resume the game  
        } else {
            text.updateGeometry(text.countdownText, `${count}`, textWinner);
        }
        count--;  
    }, 500);
}

async function handleEndGame(message) {
    gameEnded = true;
    gameStarted = false;
    // if (text.winnerMessage)
    text.updateGeometry(text.winnerMessage, message, textWinner);
    // } else {
    //     // text.createWinnerMessage(message);
    // }
    // resetTeam();
    text.button.visible = true;
    text.tryAgain.visible = true;
    text.winnerMessage.visible = true;
}

async function createSky() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sphereRadius = 70;  // The radius of the transparent sphere where the stars will be placed outside
    
    for ( let i = 0; i < 200000; i ++ ) {
        let x, y, z;
        do {
            x = THREE.MathUtils.randFloatSpread(1000); // Random x coordinate
            y = THREE.MathUtils.randFloatSpread(1000); // Random y coordinate
            z = THREE.MathUtils.randFloatSpread(1000); // Random z coordinate
        } while (Math.sqrt(x * x + y * y + z * z) < sphereRadius); // Check if the star is inside the sphere, if so, try again
        vertices.push(x, y, z);
    }
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    const particles = new THREE.Points( geometry, new THREE.PointsMaterial( { 
        color: 0xffffff,
        // sizeAttenuation: false, 
        size: 0.7, 
        opacity: 0.8, 
        transparent: true,
     } ) );
    scene.add( particles );
}

async function restart() {

    resetTeam(); // resets the ball and players;
    gameEnded = false;
    // gameStarted = true;
    text.tryAgain.visible = false; // Hide the button
    text.start.visible = true;
    text.winnerMessage.visible = false;
}

function resetTeam() {
    console.log("Reset team");
    player1.resetAll();
    player2.resetAll();
    ball.resetVelocity();
}

window.addEventListener('resize', handleResize);

async function handleResize() {
    size.width = window.innerWidth;
    size.height = window.innerHeight;

    if (camera && camera.aspect) {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        renderer.setSize(size.width, size.height);

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
    }
}

// ------------ MAYBE WILL BE USED ------------------- //

export async function cleanup3D() {
    // Dispose of all geometries, materials, and textures
    if (!scene) return;
    
    // Stop animation loop
    cancelAnimationFrame(gameLoopId);
    contentArea.style.padding = "3rem"; //to restore the padding when exit the 3D
    // Remove event listeners (if any)
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("click", buttonsManager);
    // scene.remove(ball);
    // ball.geometry.dispose();
    // ball.material.dispose();
    // ball = null;

    scene.traverse((object) => {
        if (object.isMesh) {
            console.log("cleaning objects")
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    });

    console.log(`ball cleaned: ${ball}`);

    // Remove all objects from the scene
    while (scene.children.length > 0) {
        console.log("removing objects")
        scene.remove(scene.children[0]);
    }
    ball = null;
    player1 = null;
    player2 = null;
    text = null;
    ai = null;

    // Dispose of the renderer
    renderer.dispose();
    renderer.domElement.remove();

    // Dispose of controls if using OrbitControls
    if (controls) controls.dispose();
    scene = null;
    camera = null;
    lights = null;
    plane = null;
    gameLoopId = null;

    gameStarted = false;
    gameEnded = false;

    pause = false;

    console.log("✅ 3D Scene cleaned up!");
}


