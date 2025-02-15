// // import { addLogoutListener } from "./logout.js";
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'
// import { Ball } from "./3DClasses.js";
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
import lights from "./3DLights.js";
import { saveScore } from "./localGame.js";
import * as THREE from "three";
import { Player, AIPlayer, AIController } from './3DPlayer.js';
import { Ball } from './3DBall.js';
import { SceneText, textParams, textWinner } from './3DText.js';

//----------------------------------------------------------------------------//
//-------------------- VARIABLES INITIALIZATION ------------------------------//
//----------------------------------------------------------------------------//

var baseUrl = "http://localhost"; // change (parse) later
 
let renderer, scene, camera, animationId, start, button, tryAgain;
let limits, planeGeo, planeMat, plane, controls, ai, loader, countdownText;
let player1, player2, ball, mainUse, gameLoopId, lastAIUpdate; // if the main user is player 1 or 2
let fontPath = "../three/examples/fonts/helvetiker_bold.typeface.json";
let text;
let loadedFont = null;
let winnerMessage = null;
let ifAI = false;
let gameStarted = false;
let gameEnded = false;
let pause = false;

const clock = new THREE.Clock();
clock.start();
const ray = new THREE.Raycaster();
// const rayStart = new THREE.Raycaster();
const cursor = new THREE.Vector2(0,0);

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
    winnerColor: 0x22FFFF//0x9400FF,//0xF5F045,//0xFF00FF,
}

const   size = {
    width: window.innerWidth,
    height: window.innerHeight,
}

// const textParams = {
//     size: 1.5,
//     depth: 0.5,
//     curveSegments: 12,
//     bevelEnabled: true,
//     bevelThickness: 0.02,
//     bevelSize: 0.02,
//     bevelSegments: 3
// }

// const textWinner = {
//     size: 2,
//     depth: 0.5,
//     curveSegments: 30,
// }

//---------------------------------------------------------------------------------//
// ------------------ LOCAL GAME WITH ANOTHER PLAYER FUNCTIONS ------------------- //
//---------------------------------------------------------------------------------//

// Start game function
export function startLocalGame(playerName1, playerName2, mainUserNmb) {
    // Set up scene

    setupScene();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(45, 20, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    mainUser = mainUserNmb;

    setupField();
    // console.log('Starting local game...');

    player1 = new Player(limits, scene, -1, playerName1, new THREE.Vector3(0, 0, field.y - 2));
    player2 = new Player(limits, scene, 1, playerName2, new THREE.Vector3(0, 0, -field.y + 2));
    ball = new Ball(scene, limits, [player1, player2], false);
    setupEvents();
    setupControls();
    // ROTATE THE BUTTON
    animateLocal();

}

// Event listeners for player controls
export function setupControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
        if (e.code === "Space") {
            console.log("Spacebar pressed! Starting game...");
            if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            start.visible = false; // Hide the button
            button.visible = false;
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
function animateLocal() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.1)
    
    if (gameStarted && !gameEnded) {
        ball.update(dt);
        player1.move();
        player2.move();
    } else {
        ball.resetPos();
        player1.resetPos();
        player2.resetPos();
    }

    // console.log(ball.mesh.position);
    controls.update();  // Required if you have damping enabled

    // Update scene and render 
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateLocal);
}

//--------------------------------------------------------------------//
// -------------------- GAME WITH AI FUNCTIONS ---------------------- //
//--------------------------------------------------------------------//

export function start3DAIGame(playerName2) {

    // ifAI = true;
    
    setupScene();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    console.log(`Inicially ${playerName2}`);
    setupField();
    player2 = new AIPlayer(limits, scene, 1, playerName2, new THREE.Vector3(0, 0, field.y - 2));
    player1 = new AIPlayer(limits, scene, -1, "Enemy", new THREE.Vector3(0, 0, -field.y + 2));
    ball = new Ball(scene, limits, [player1, player2], true);
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
            console.log("Spacebar pressed! Starting game...");
            if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") player2.down = false;
        if (e.key === "ArrowRight") player2.up = false;
    });
}

// AI Game loop
function animateAI() {
   
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    const dt = Math.min(deltaTime, 0.05)
    
    if (gameStarted && !pause) {
        ball.update(dt, pause);
        ai.update(elapsedTime);
        player2.move();
        // player1.move();
        // ai.checkIfAIneedStop();
        // Check if 1 second has passed before updating the AI
        // if (clock.getElapsedTime() - lastAIUpdate >= 1) {
        //     ai.setTarget(ball);
        //     lastAIUpdate = clock.getElapsedTime();  // Reset timer
        // }

    } else {
        ball.resetPos();
        player1.resetPos();
        player2.resetPos();
    }

    // console.log(`${ball.mesh.position.x}`);
    controls.update();  // Required if you have damping enabled
   
    // Update scene and render
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateAI);
}

//--------------------------------------------------------------------//
// ---------------------- COMMON FUNCTIONS -------------------------- //
//--------------------------------------------------------------------//

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(params.fogColor);
    scene.fog = new THREE.Fog(params.fogColor, params.fogNear, params.fogFar);
    text = new SceneText(scene);
}

function setupField() {
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
    planeGeo = new THREE.PlaneGeometry( // or 20
        limits.x * 20,
        limits.y * 20,
        limits.x * 20,
        limits.y * 20,
        // limits.x * 2,
        // limits.y * 2,
        // limits.x * 2,
        // limits.y * 2
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
    console.log(`Left bound is: ${leftBound.position.x}, Right bound is: ${rightBound.position.x}`)
    scene.add(leftBound, rightBound);

    // if (!gameStarted && !button & !start)
    //     createButton();
    createSky();
}

function setupEvents() {
    ball.addEventListener("aifinish", (e) => {
        // console.log('goal!!', e.message);
        handleEndGame(e.message);
        console.log('goal!! player name', e.message);
    })

    ball.addEventListener("localfinish", (e) => {
        // console.log('goal!!', e.message);
        handleEndGame();
        saveScore(player1.score, player2.score, mainUserNmb);

        console.log('goal!! player name', e.message);
    })

    ball.addEventListener("aipause", (e) => {
        // console.log('goal!!', e.message);
        console.log('goal!! pause');
        pause = true;
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

        console.log('goal!! restart');
    })
    
    window.addEventListener("click", (event) => {
        if (gameStarted) return; // Ignore clicks after the game starts
    
        // Convert mouse position to normalized device coordinates (-1 to +1)
        cursor.x = (event.clientX / window.innerWidth) * 2 - 1;
        cursor.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Raycast to check for intersections
        ray.setFromCamera(cursor, camera);
        const intersects = ray.intersectObject(text.button);
        // rayStart.setFromCamera(cursor, camera);
        const intersectsStart = ray.intersectObject(text.start);
        const intersectsTryAgain = ray.intersectObject(text.tryAgain);
    
        if ((intersects.length > 0 || intersectsStart.length > 0) && !gameEnded ) {
            console.log("3D Start Button Clicked!");
            // if (gameStarted) return; // Prevent multiple starts
            // lastAIUpdate = 1;
            gameStarted = true;
            text.start.visible = false; // Hide the button
            text.button.visible = false;
        } else if ((intersects.length > 0 || intersectsTryAgain.length > 0) && gameEnded ) {
            console.log("3D TryAgain Button Clicked!");
            // if (gameStarted) return; // Prevent multiple starts
            resetTeam(); // resets the ball and players;
            gameEnded = false;
            // gameStarted = true;
            text.tryAgain.visible = false; // Hide the button
            text.start.visible = true;
            text.winnerMessage.visible = false;

        }
    });
}

function showCountdown(callback) {
    let count = 2;
    text.updateGeometry(text.countdownText, "3", textWinner);
    text.countdownText.visible = true;
    
    const interval = setInterval(() => {
        if (count === 0) {
            text.updateGeometry(text.countdownText, "GO !", textWinner);
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

function handleEndGame(message) {
    gameEnded = true;
    gameStarted = false;
    if (text.winnerMessage) {
        text.updateGeometry(text.winnerMessage, message, textWinner);
    } else {
        text.createWinnerMessage(message);
    }
    text.button.visible = true;
    text.tryAgain.visible = true;
    text.winnerMessage.visible = true;
}

function createSky() {
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

function resetTeam() {
    player1.resetTeam();
    player2.resetTeam();
}

window.addEventListener('resize', handleResize);

function handleResize() {
    size.width = window.innerWidth;
    size.height = window.innerHeight;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
}

// ------------ MAYBE WILL BE USED ------------------- //

export function cleanup3D() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }
     // Dispose of the scene and objects
     if (scene) {
        // If cube is added to the scene, remove it
        scene = null;
    }
    // Dispose of the camera if necessary (optional)
    camera = null;
    console.log("3D scene cleaned up");
}


// function animateIdleAI() {
//     requestAnimationFrame(animateIdleAI);
//     // Ensure paddles are visible in the static scene
//     ball.resetPos();
//         player1.resetPos();
//         player2.resetPos();
//     // player1.mesh.position.set(0, 0, limits.y - 1); // Adjust position
//     // player2.mesh.position.set(0, 0, -limits.y + 1);
//     // ball.mesh.position.set(0, 0, 0); // Keep ball in the center
//     renderer.render(scene, camera);
// }


