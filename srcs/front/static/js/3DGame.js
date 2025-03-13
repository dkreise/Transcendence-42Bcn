
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { saveScore } from "./localGame.js";
import * as THREE from "three";
import { Player, AIPlayer, AIController, OnlinePlayer } from './3DPlayer.js';
import { Ball, OnlineBall } from './3DBall.js';
import { SceneText, textParams, textWinner } from './3DText.js';
import { AmbientLight, DirectionalLight , Vector3} from 'three'
import { drawHeader, navigateTo } from "./main.js";
import { quitTournament, saveTournamentGameResult, startTournamentGame, stopTournamentGame } from "./tournament.js"
import { checkToken } from "./onlineStatus.js";

//----------------------------------------------------------------------------//
//-------------------- VARIABLES INITIALIZATION ------------------------------//
//----------------------------------------------------------------------------//


const gamePort = window.env.GAME_PORT;
const host = window.env.HOST;
const protocolSocket = window.env.PROTOCOL_SOCKET;

let renderer, scene, camera, player, opponent, waiting = false, mainplayer, headerHeight;

let limits, planeGeo, planeMat, plane, addplane, controls, ai, loader, countdownText;
let player1, player2, ball, gameLoopId, targetBallX, targetBallY; // if the main user is player 1 or 2
let mainUser, lights, dict, socket = null, roomID = null, moveCamera = false, cameraId, remote = false;
let ifAI = false, tournamentId;
let gameStarted = false;
let gameEnded = false;
let pause = false;
export let text = null;

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
    radius: 5,
    seg: 0.25
}

export const params = {
	planeColor: 0x9999DD, //0xDDDDFF, //0x9999DD, // 0x555577, //0xb994ff, //0x9b71ea, //0x6966ff,
	fogColor: 0x000033,//0x000022, //0x9e7aff,
	fogNear: 50,
	fogFar: 150,
    textY:  20,
    buttonColor: 0x9400FF,
    winnerColor: 0x22FFFF,//0x9400FF,//0xF5F045,//0xFF00FF,
    // winnerPosAI: new THREE.Vector3(0, 20, 1.5),
    // winnerPosPlayers: new THREE.Vector3(0, 2, field.x + 3),
}

export const textCount = {
    size: 2.5,
    depth: 0.5,
    curveSegments: 30,
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
    // drawHeader(1)
    // const contentArea = document.getElementById('content-area');
    // contentArea.style.padding = 0;
    dict = dict;
    window.gameDict = dict;

    init();
    // gameStarted = false;
    await setupScene();
    text = new SceneText(scene, dict, null, 0, -Math.PI / 2, 0);
    await text.createText();

    // text.group.rotation.y = text.rotation;
    camera = new THREE.PerspectiveCamera(75, size.width / (size.height - 36), 0.1, 1000);
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
        if (!player1 || ! player2) return ;

        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
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
            restart();
            // resetTeam();
            // gameEnded = false;
            // text.tryAgain.visible = false;
            // text.winnerMessage.visible = false;
            // text.start.visible = true; // Hide the button
            
        }
    });

    window.addEventListener("keyup", (e) => {
        if (!player1 || ! player2) return ;
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
export async function start3DRemoteGame(dict, tournament, roomId, isCreator) {
    window.gameDict = dict;
    init();
    remote = true;
    tournamentId = tournament;
    // roomID = roomId;
    console.log(`ROOM ID: ${roomId}`)
    if (!roomId && ! tournament) {
        navigateTo('/remote-home');
        return ;
    }
    await setupScene();
    text = new SceneText(scene, dict,  tournamentId, 0, -Math.PI / 2);
    await text.createText();
    text.button.position.set(0, 200, 52);
    text.start.position.set(0, 200, 53.5);
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    if (!tournamentId) {
        camera.position.set(-90.5, 200.5, 0);
        camera.lookAt(new THREE.Vector3(0, 201, 53))
        roomID = (isCreator | 0) + roomId.toString();
    } else {
        camera.position.set(-39.5, 22.5, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0))
    }

    await createLights(-20);
    await setupField();
    controls.target.set(50, 201, 0);
    if (tournamentId)
        controls.target.set(0, 7, 0);
    // console.log('Starting remote 3D game...');

    setupRemoteEvents();
    if (tournamentId) {
        await animateCameraToField();
        startTournamentGame();
    }
    // gameStarted = true;
    animateRemote();
    

}

async function setupRemoteEvents() {
    
    window.addEventListener("keydown", async (e) => {
       
        if (e.code === "Space" && !gameStarted && !gameEnded &&  text.start.visible == true) {
            // console.log("Spacebar pressed! Starting game...");

            text.start.visible = false; // Hide the button
            text.button.visible = false;
            if (!moveCamera) {
                moveCamera = true;
                text.button.position.set(0, params.textY, 0);
                text.start.position.set(0, params.textY, 1.5);
                await animateCameraToField()
            } else if (!tournamentId) {
                initializeWebSocket(roomID);
            }
        }
        if (e.code === "Space" && !gameStarted && gameEnded && text.tryAgain.visible == true) {
            restart();
        }
    });
    window.addEventListener("click", (event) => { buttonsManager(event) }); // add a different action here
    window.addEventListener("beforeunload", beforeUnloadHandlerRemote);
}

// Event listeners for player controls
export function setupRemoteControls(player) {
    window.addEventListener("keydown", (e) => {
        if (!player) return ;
        if (e.key === "w") player.up = true;
        if (e.key === "s") player.down = true;
        if (e.key === "ArrowUp") player.up = true;
        if (e.key === "ArrowDown") player.down = true;
        
    });

    window.addEventListener("keyup", (e) => {
        if (!player) return ;
        if (e.key === "w") player.up = false;
        if (e.key === "s") player.down = false;
        if (e.key === "ArrowUp") player.up = false;
        if (e.key === "ArrowDown") player.down = false;
    });
}

//async function initializeWebSocket(roomId) {
async function initializeWebSocket(roomId = 123) {
    let retries = 0;
    console.warn(`Initializing Web socket... ROOM ID ${roomId}`);
    const access_token = localStorage.getItem("access_token");
	const token = await checkToken(access_token);
    if (!token) {
        console.log("No access token found");
        return ;
    }
    if (!socket)
    {
        text.waiting.visible = true;
        socket = new WebSocket(`${protocolSocket}://${host}:${gamePort}/${protocolSocket}/G/${roomId}/?token=${token}`);
    }
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => {
        console.log("WebSocket encountered an error:", error);
        // alert("Unable to connect to the server. Please check your connection.");
    };
    socket.onclose = async (event) => {
        console.log("WebSocket closing with code:", event.code);

        // console.log("WebSocket connection closed. ...");
        if (event.code === 4001) {
            // Token expired; refresh token logic
            try {
                await refreshAccessToken();
                // Reconnect with the new token
                initializeWebSocket(roomId);
            } catch (err) {
                console.log("Failed to refresh token", err);
                cleanup3D();
                return; 
            }
        }
    };

    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "role":
                await scale3DGame(data);
                break;
            case "players":
                // console.log(`Player 1 name: ${data.p1}, Player 2 name: ${data.p2}`)
                await setWhoAmI3D(data, socket);
                // socket.send(JSON.stringify({"type": "ready"}))
                break;
            case "status":
                await handle3DStatus(data);
                break;
            case "update":
                handle3DUpdate(data);
                break ;
            case "endgame":
                console.log("endgame!"); 
                handleOnlineEndgame(data);
                break;
            default:
                console.log("Unhandled message type:", data.type);
        }
    };
}

function convertYToFront(backY) {
    return (limits.x - backY * limits.x * 2);
}

function convertXToFront(backX) {
    return (backX * limits.y * 2 - limits.y);
}

export async function scale3DGame(data)
{
    console.log("333333333333D sCALE GAME")
    if (!player1) {
        player1 = new OnlinePlayer(data, dict, limits, scene, -1, "player1", new THREE.Vector3(0, 0, -field.y), -0.1, -0.5, 0);
        console.log(`player1: ${field.y}`)
        // console.log(`convert 0.5 to front: ${player1.convertXFromBack(0.5)}`);
        // console.log(`convert 0 to back: ${player1.convertXToBack(0)}`);
        player2 = new OnlinePlayer(data, dict, limits, scene, 1, "player2", new THREE.Vector3(0, 0, field.y), -0.1, -0.5, 0);
        ball = new OnlineBall(data, dict, scene, limits, [player1, player2], false);
        waiting = true;
    }
    handle3DRoleAssignment(data.role);
}

export async function handle3DStatus(data, tourSocket = null)
{
	if (tourSocket) {
		socket = tourSocket;
	}
	if (data.wait)
	{
		if (data.countdown == 3) {
            console.log(data.countdown)
            gameStarted = false;
            console.log(`after scored ball.x: ${data.ball.x}, after scored ball.y: ${data.ball.y}`)
            ball.resetPos();
            await firstCountdown(() => {
            });
        }
	}
	else
	{
		console.log("let's start the game!");
        waiting = false;
        gameStarted = true;
	}
}

export function handle3DUpdate(data)
{
	if (data.players)
    {
        gameStarted = true;
        // console.log("update data players");
        let pl1 = data["players"]["player1"]["y"];
        let pl2 = data["players"]["player2"]["y"];
        // console.log(`p1 Y: ${pl1} `);
        player1.update(pl1, data["scores"]["player1"]);
        player2.update(pl2, data["scores"]["player2"]);
    }
    if (data.ball) {
        // console.log(`ball.back x: ${data.ball.x}, ball.back y: ${data.ball.y}`)
        ball.mesh.position.z = convertXToFront(data.ball.x);
        ball.mesh.position.x = convertYToFront(data.ball.y);
        // console.log(`ball.x: ${ball.mesh.position.z}, ball.Y: ${ball.mesh.position.x}`)
    }
}

export async function setWhoAmI3D(data, sock) {
    console.log("3DDDDDD Set who am I ");
    text.waiting.visible = false;
    text.enemy.visible = true;
    await player1.setupText();
    await player2.setupText();
    // console.log(`player1: ${data.player1}, player2: ${data.player2}`)
    player1.setName(data.player1);
    player2.setName(data.player2);
    sock.send(JSON.stringify({"type": "ready"}))
}

function handle3DRoleAssignment(role) {
	console.log("3DDDDDD Hi! I'm " + role + " Setting REmote controls");
	if (role === "player1") {
        setupRemoteControls(player1);
        mainplayer = player1;
	} else if (role === "player2") {
        setupRemoteControls(player2);
        mainplayer = player2;
	}
}

// Game loop
async function animateRemote() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.1)
    
    if (gameStarted && !waiting) {
        mainplayer.move(socket);
    } 
    // console.log(ball.mesh.position);
    controls.update();  // Required if you have damping enabled
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateRemote);
}

async function animateCameraToField() {
    const startPosition = new THREE.Vector3(-70.5, 240.5, 0);
    const targetPosition = new THREE.Vector3(-39.5, 22.5, 0); // Adjust to your desired final camera position
    const startLookAt = new THREE.Vector3(0, 170, 52);
    const targetLookAt = new THREE.Vector3(0, 7, 0); // Field position (where camera should look)
    
    const duration = 1000; // Duration of animation in milliseconds
    const startTime = performance.now();

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function updateCamera() {
        const elapsedTime = performance.now() - startTime;
        const t = Math.min(elapsedTime / duration, 1); // Normalize to 0-1 range
        const easedT = easeInOutQuad(t); // Apply easing function
        // Interpolate (lerp) between current and target positions
        camera.position.lerpVectors(startPosition, targetPosition, easedT);
        controls.target.lerpVectors(startLookAt, targetLookAt, easedT);

        controls.update(); // Update orbit controls

        renderer.render(scene, camera);

        if (t < 1) {
            cameraId = requestAnimationFrame(updateCamera); // Continue animation
        } else {
            cancelAnimationFrame(cameraId);
            if (!tournamentId)
                initializeWebSocket(roomID);
            return;
        } 
    }

    cameraId = requestAnimationFrame(updateCamera); // Start animation loop
}

const beforeUnloadHandlerRemote = () => {
    if (tournamentId) {
		stopTournamentGame();
	}
};

//--------------------------------------------------------------------//
// -------------------- GAME WITH AI FUNCTIONS ---------------------- //
//--------------------------------------------------------------------//

export async function start3DAIGame(playerName2, dict, tournament = null) {

    // dict = dict;
    window.gameDict = dict;
    init();
    if (tournament)
        tournamentId = tournament.id;
    // console.log(tournament.id);
    await setupScene();
    text = new SceneText(scene, dict, tournamentId);
    await text.createText();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(0, 20, 45);
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    await createLights(20);
    await setupField();
    player2 = new AIPlayer(dict, limits, scene, 1, playerName2, new THREE.Vector3(0, 0, field.y - 2), -0.1);
    player1 = new AIPlayer(dict, limits, scene, -1, dict['enemy'], new THREE.Vector3(0, 0, -field.y + 2), -0.1);
    ball = new Ball(dict, scene, limits, [player1, player2], true);
    ai = new AIController(player1, ball, limits);
    setupEvents();
    setupAIControls();
    animateAI();
    if (tournament) {
        showCountdown(() => {
            // console.log("Game resuming!");
            ball.resetVelocity(); // Randomize direction
            // console.log(`Velocity reset to x - ${ball.velocity.x}, z - ${ball.velocity.z}`);
            gameStarted = true;
        });
    }
}

function setupAIControls() {
    window.addEventListener("keydown", (e) => {
        if (!player2) return ;
        if (e.key === "ArrowLeft") player2.down = true;
        if (e.key === "ArrowRight") player2.up = true;
        if (e.code === "Space" && !gameStarted && !gameEnded && text.start.visible == true) {
            // console.log("Spacebar pressed! Starting game...");
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
        }
        if (e.code === "Space" && !gameStarted && gameEnded && text.tryAgain.visible == true) {
            // console.log("Spacebar pressed! Try again...");
            restart();
        }
    });

    window.addEventListener("keyup", (e) => {
        if (!player2) return ;
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
    controls.update();  // Required if you have damping enabled
    // console.log(`camera ${camera.position.x}x${camera.position.y}x${camera.position.z}`)
   
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateAI);
}

//--------------------------------------------------------------------//
// ---------------------- COMMON FUNCTIONS -------------------------- //
//--------------------------------------------------------------------//

async function setupScene() {
    const contentArea = document.getElementById('content-area');
    contentArea.style.padding = 0;
    
    scene = new THREE.Scene();
    drawHeader('3d');
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
    controls.enableDamping = true
    scene.add(...lights);
    
    limits = new THREE.Vector2(field.x, field.y);
    planeGeo = new THREE.PlaneGeometry(
        limits.x * 3,
        limits.y * 3,
        limits.x * 3,
        limits.y * 3,
    );

    planeGeo.rotateX(-Math.PI * 0.5);
    planeMat = new THREE.MeshStandardMaterial({ 
        color: params.planeColor,
    });
    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.y = 0.01
    let addplaneGeo = new THREE.PlaneGeometry(
        limits.x * 20,
        limits.y * 20,
        limits.x * 20,
        limits.y * 20,
    );

    addplaneGeo.rotateX(-Math.PI * 0.5);
    let addplaneMat = new THREE.MeshStandardMaterial({ 
        color: params.planeColor,
    });
    addplane = new THREE.Mesh(addplaneGeo, addplaneMat);
    plane.receiveShadow = true;
    scene.add(plane, addplane)

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
    // console.log(`left bound: ${leftBound.position.x}, right bound: ${rightBound.position.x}`)
    scene.add(leftBound, rightBound);

    await createSky();
}

async function setupEvents() {
    ball.addEventListener("aifinish", (e) => {
        handleEnd3DGame(e.message);
        if (tournamentId) {
            console.log(player2.name);
            if (e.player == window.gameDict['enemy'])
                saveTournamentGameResult("@AI", player2.name, player1.score, player2.score);
            else
                saveTournamentGameResult(e.player, "@AI", player1.score, player2.score);
        }
        tournamentId = null;
    })

    ball.addEventListener("localfinish", (e) => {
        handleEnd3DGame(e.message);
        if (!player1 || !player2) return;
        saveScore(player1.score, player2.score, mainUser);
    })

    ball.addEventListener("aipause", (e) => {
        // console.log('goal!! pause');
        pause = true;
        showCountdown(() => {
            // console.log("Game resuming!");
            ball.resetVelocity(); // Randomize direction
            // console.log(`Velocity reset to x - ${ball.velocity.x}, z - ${ball.velocity.z}`);
            pause = false;
        });
    })

    ball.addEventListener("airestart", (e) => {
        pause = false;
    })

    window.addEventListener("beforeunload", beforeUnloadHandlerAI);
    
    window.addEventListener("click", (event) => { buttonsManager(event) });
}

const beforeUnloadHandlerAI = () => {
    if (tournamentId && !remote) {
        saveTournamentGameResult("@AI", player2.name, 0, player1.score);
    }
};

async function buttonsManager(event) {
    if (gameStarted) return; // Ignore clicks after the game starts
    if (!text || !text.button || !text.start || !text.tryAgain) {
        console.log("One or more 3D buttons are not initialized.");
        return;
    }
    // Convert mouse position to normalized device coordinates (-1 to +1)
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

    if ((intersects.length > 0 || intersectsStart.length > 0) && !gameEnded && text.start.visible == true ) {
        console.log("3D Start Button Clicked!");
        text.start.visible = false; // Hide the button
        text.button.visible = false;
        if (remote && !moveCamera) {
            moveCamera = true;
            text.button.position.set(0, params.textY, 0);
            text.start.position.set(0, params.textY, 1.5);
            await animateCameraToField()
        } else if (remote && !tournamentId) {
            initializeWebSocket(roomID);
        } else {
            gameStarted = true;
        }
    } else if ((intersects.length > 0 || intersectsTryAgain.length > 0) && gameEnded && text.tryAgain.visible == true) {
        console.log("3D TryAgain Button Clicked!");
        restart();
    }
}

//async function showCountdown(callback) {
//    let count = 2;
//    text.updateGeometry(text.countdownText, "3", textCount);
//    text.countdownText.visible = true;
//    const interval = setInterval((dict) => {
//        // console.log(window.gameDict);
//        if (count === 0) {
//            text.updateGeometry(text.countdownText, window.gameDict['go'], textCount);
//        } else if (count < 0) {
//            clearInterval(interval);
//            text.countdownText.visible = false; // Hide instead of remove
//            callback(); // Resume the game  
//        } else {
//            text.updateGeometry(text.countdownText, `${count}`, textCount);
//        }
//        count--;  
//    }, 1000);
//}

async function showCountdown(callback) {
    let count = 2;
    text.updateGeometry(text.countdownText, "3", textCount);
    text.countdownText.visible = true;
    const interval = setInterval((dict) => {
        // console.log(window.gameDict);
        if (count === 0) {
            text.updateGeometry(text.countdownText, window.gameDict['go'], textCount);
        } else if (count < 0) {
            clearInterval(interval);
            text.countdownText.visible = false; // Hide instead of remove
            callback(); // Resume the game  
        } else {
            text.updateGeometry(text.countdownText, `${count}`, textCount);
        }
        count--;  
    }, 500);
}

async function firstCountdown(callback) {
    let count = 3;
    if (text.enemy.visible === true) {
        count = 2;
    } else {
        text.updateGeometry(text.countdownText, `${count}`, textCount);
        text.countdownText.visible = true;
    }
    const interval = setInterval(() => {   
        if (!scene)
            return ; 
        if (count == 2 && text.enemy.visible === true) {
            text.enemy.visible = false;
            text.updateGeometry(text.countdownText, `${count}`, textCount);
            player1.show();
            player2.show();
            text.countdownText.visible = true;
        } else if (count === 0) {
            text.updateGeometry(text.countdownText, window.gameDict['go'], textCount);
        } else if (count < 0) {
            clearInterval(interval);
            text.countdownText.visible = false; // Hide instead of remove
            callback(); // Resume the game  
        } else {
            text.updateGeometry(text.countdownText, `${count}`, textCount);
        }
        count--;  
    }, 500);
}

async function handleEnd3DGame(message) {
    gameEnded = true;
    gameStarted = false;
    if (!text)
        return ;
    if (text.winnerMessage)
        text.updateGeometry(text.winnerMessage, message, textWinner); // PUT BACK
    if (!tournamentId) {
        text.button.visible = true;
        text.tryAgain.visible = true;
    }
    text.countdownText.visible = false;
    text.winnerMessage.visible = true;
}

export async function  handleOnlineEndgame(data) {
    
    const { winner, loser, scores} = data;
    const msg = `${winner} ` + window.gameDict['wins'] + " !";
	console.log(`winner ${winner} loser ${loser}`);
    if (!scene)
        return ;
	if (socket && socket.readyState === WebSocket.OPEN && !tournamentId) {
        console.log(`Closing socket tourId: ${tournamentId}`);
		socket.close();
		socket = null;
	} 
    handleEnd3DGame(msg);
    if (tournamentId){
        // tournamentId = null;
        saveTournamentGameResult(data["winner"], data["loser"], data["scores"]["player1"], data["scores"]["player2"]);
    }
    // resetOnlineTeam();
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

    if (!remote) {
        resetTeam(); // resets the ball and players;
    } else {
        resetOnlineTeam();
    }
    gameEnded = false;
    // gameStarted = true;
    text.tryAgain.visible = false; // Hide the button
    text.winnerMessage.visible = false;
    if (!remote) {
        text.start.visible = true;
    } else {
        text.button.visible = false;
        initializeWebSocket(roomID);
    }
}

function resetOnlineTeam() {
    console.log("Reset team");
    player1.resetAll();
    player2.resetAll();
    ball.resetPos();
}


function resetTeam() {
    console.log("Reset team");
    player1.resetAll();
    player2.resetAll();
    ball.resetVelocity();
}

window.addEventListener('resize', handleResize);

async function handleResize() {
    if (!scene) return ;
    const header = document.getElementById('header-container');
    if (!header)    return ;
    headerHeight = header.offsetHeight;
    size.width = window.innerWidth;
    size.height = window.innerHeight - headerHeight;

    if (camera && camera.aspect) {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        renderer.setSize(size.width, size.height);

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
    }
}

// ------------ MAYBE WILL BE USED ------------------- //

export async function exit3D() {
    // tournamentId = localStorage.getItem('currentTournamentId')
    // if (tournamentId) 
    //     quitTournament();
    console.log(`EXITING tournament, the ID is ${tournamentId}`)
    cleanup3D();
    navigateTo('/home');
}

export async function cleanup3D() {
    // Dispose of all geometries, materials, and textures
    if (!scene) return;
    
    if (tournamentId && remote)
        stopTournamentGame();
    // if (tournamentId) 
    //     quitTournament();

    drawHeader('main')
    
    if (socket && socket.readyState === WebSocket.OPEN && !tournamentId) {
        console.log("333ddd Closing SOCKET~")
        socket.close();
        socket = null;
    }

    
    // Stop animation loop
    cancelAnimationFrame(gameLoopId);

    const contentArea = document.getElementById('content-area');

    contentArea.style.padding = "3rem"; //to restore the padding when exit the 3D
    // Remove event listeners (if any)
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("click", buttonsManager);
    if (remote && tournamentId) {
        window.removeEventListener("beforeunload", beforeUnloadHandlerRemote);
    } else if (!remote && tournamentId) {
        window.removeEventListener("beforeunload", beforeUnloadHandlerAI);
    }

    scene.traverse((object) => {
        if (object.isMesh) {
            // console.log("cleaning objects")
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


    // Remove all objects from the scene
    while (scene.children.length > 0) {
        // console.log("removing objects")
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
    remote = false ; 
    tournamentId = null;
    gameStarted = false;
    gameEnded = false;
    roomID = null;
    moveCamera = false;

    pause = false;

    console.log("✅ 3D Scene cleaned up!");
}


function init() {
    remote = false;
    gameEnded = false;
    gameStarted = false;
    pause = false;
    waiting = false;
    // drawHeader('3d');
    const contentArea = document.getElementById('content-area');
    contentArea.style.padding = 0;
    tournamentId = null;
    
}
