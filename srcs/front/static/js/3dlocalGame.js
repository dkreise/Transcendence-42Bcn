import { makeAuthenticatedRequest } from "./login.js";
// // import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Ball, Player, AIController } from "./3DClasses.js";
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
// import srcFont from "../three/examples/fonts/helvetiker_regular.typeface.json?url"
import lights from "./3DLights.js";
import * as THREE from "three";

var baseUrl = "http://localhost"; // change (parse) later

let renderer, scene, camera, animationId, cube, ball, start;
let limits, planeGeo, planeMat, plane, controls, ai, button;

let ifAI = false;
let gameStarted = false;

const clock = new THREE.Clock();
clock.start();
const ray = new THREE.Raycaster();
const rayStart = new THREE.Raycaster();
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

const params = {
	planeColor: 0xb994ff, //0x9b71ea, //0x6966ff,
	fogColor: 0x000000, //0x9e7aff,
	fogNear: 25,
	fogFar: 150,
	// paddleColor: 0x3633ff, //0x3633ff,
	// ballColor: 0xce47ff, //0xe63d05,
}


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
        if (cube) {
            scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
            cube = null;
        }
        scene = null;
    }

    // Dispose of the camera if necessary (optional)
    camera = null;

    console.log("3D scene cleaned up");
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

            // startLocalGame(data['player1'], data['player2'], data['main_user']);
            start3DAIGame(localStorage.getItem('username'));


        } else {
            console.log('Response: ', data);
            console.error('Failed to fetch the local game:', data.error);
        }
    })
    .catch(error => {
        console.error('Catch error loading local game: ', error);
    });
 
}

// Game Initialization
// let canvas = null;
// let ctx = null;
let player1 = null;
let player2 = null;
let mainUser = null; // if the main user is player 1 or 2
// let ball = null;
let gameLoopId = null;
let maxScore = 2;
// let scene, camera, renderer;

export function saveScore() {

    makeAuthenticatedRequest(baseUrl + ":8001/api/game/local/save-local-score/", {
        method: "POST",
        body: JSON.stringify({
            // 'player1': player1.name,
            'score1': player1.score,
            // 'player2': player1.name,
            'score2': player2.score,
            
            'main_user': mainUser, 
        }),
        headers: {"Content-Type": "application/json"},
    })
    .then((response) => {
        if (response.ok) {
            console.log('Score saved successfully');
        }
    })
    .catch(error => {
        console.error('Catch error saving score: ', error);
    });
}


// Game loop
function animate() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.1)
    
    // ray.setFromCamera(player1.mesh.position, camera);
    // const [intersection] = ray.intersectObject(plane);

    // if (intersection) {
    //     const nextX = intersection.point.x;
    //     const prevX = player1.mesh.position.x;
    //     player1.mesh.position.x = THREE.MathUtils.lerp(prevX, nextX, 0.1);
    // }
    // 1:19:19 

    ball.update(dt);
    // console.log(ball.mesh.position);
    controls.update();  // Required if you have damping enabled

    player1.move();
    player2.move();
    // Update scene and render
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animate);


    // // Endgame check
    // if (player1.score >= maxScore || player2.score >= maxScore) {
    //     const winner = player1.score > player2.score ? `${player1.name} Wins!` : `${player2.name} Wins!`;
    //     const finalScore = `${player1.score} - ${player2.score}`;
    //     cancelAnimationFrame(gameLoopId);
    //     // player1.displayEndgameMessage(ctx, finalScore, winner);
    //     saveScore();
    // }
}

// AI Game loop
function animateAI() {
   
    const deltaTime = clock.getDelta();
    const dt = Math.min(deltaTime, 0.05)
    
    if (gameStarted) {
        ball.update(dt);
        ai.update(dt);
        player2.move();
    } else {
        ball.resetPos();
        player1.resetPos();
        player2.resetPos();
    }

    
    // console.log(`${ball.mesh.position.x}`);
    controls.update();  // Required if you have damping enabled
    
    // player1.move();
   
    // Update scene and render
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(animateAI);


    // // Endgame check
    // if (player1.score >= maxScore || player2.score >= maxScore) {
    //     const winner = player1.score > player2.score ? `${player1.name} Wins!` : `${player2.name} Wins!`;
    //     const finalScore = `${player1.score} - ${player2.score}`;
    //     cancelAnimationFrame(gameLoopId);
    //     // player1.displayEndgameMessage(ctx, finalScore, winner);
    //     saveScore();
    // }
}

// Event listeners for player controls
export function setupControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "w") player1.up = true;
        if (e.key === "s") player1.down = true;
        if (e.key === "ArrowUp") player2.up = true;
        if (e.key === "ArrowDown") player2.down = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "w") player1.up = false;
        if (e.key === "s") player1.down = false;
        if (e.key === "ArrowUp") player2.up = false;
        if (e.key === "ArrowDown") player2.down = false;
    });
}

function setupAIControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player2.up = true;
        if (e.key === "ArrowRight") player2.down = true;
        if (e.code === "Space") {
            console.log("Spacebar pressed! Starting game...");
            if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            start.visible = false; // Hide the button
            button.visible = false;
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") player2.up = false;
        if (e.key === "ArrowRight") player2.down = false;
    });
}

// Start game function
export function startLocalGame(playerName1, playerName2, mainUserNmb) {
    // Set up scene

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(45, 20, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    mainUser = mainUserNmb;

    setupField();

    // console.log('Starting local game...');

    player1 = new Player(limits, scene, -1, playerName1, new THREE.Vector3(0, 0, field.y - 2), true);
    player2 = new Player(limits, scene, 1, playerName2, new THREE.Vector3(0, 0, -field.y + 2), true);
    ball = new Ball(scene, limits, [player1, player2]);
    
    setupControls();
    setupEvents();
    // setupText();
    animate();

}

export function start3DAIGame(playerName2) {

    ifAI = true;
    // MAKE IT ANOTHER FUNCTION
    scene = new THREE.Scene();
    scene.background = new THREE.Color(params.fogColor)
    scene.fog = new THREE.Fog(params.fogColor, params.fogNear, params.fogFar)

    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

   
    setupField();
    player2 = new Player(limits, scene, 1, playerName2, new THREE.Vector3(0, 0, field.y - 2), true);
    player1 = new Player(limits, scene, -1, "Enemy", new THREE.Vector3(0, 0, -field.y + 2), true);
    ball = new Ball(scene, limits, [player1, player2]);
    ai = new AIController(player1, ball);
    // player1.setupTextAI();
    setupAIControls();
    if (!gameStarted)
        createButton();
    setupEvents();
    // animateIdle();
    // setupText();
    animateAI();

}


function setupField() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(size.width, size.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    document.getElementById('content-area').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true
    scene.add(...lights);
    limits = new THREE.Vector2(field.x, field.y);
    planeGeo = new THREE.PlaneGeometry(
        limits.x * 20,
        limits.y * 20,
        limits.x * 20,
        limits.y * 20
    );

    planeGeo.rotateX(-Math.PI * 0.5);
    planeMat = new THREE.MeshStandardMaterial({ 
        // color: params.planeColor,
        // wireframe: true, 
        // transparent: true, 
        // opacity: 0.5 
        color: 0xffffff,
    });

    plane = new THREE.Mesh(planeGeo, planeMat);
    plane.receiveShadow = true;
    scene.add(plane)

    const boundGeo = new RoundedBoxGeometry(field.width, field.height, limits.y * 2, field.radius, field.seg);
    const boundMat = new THREE.MeshNormalMaterial();
    const leftBound = new THREE.Mesh(boundGeo, boundMat);
    leftBound.position.x = -limits.x - field.width / 2;

    const rightBound = leftBound.clone();
    rightBound.position.x *= -1;

    scene.add(leftBound, rightBound);
    

}

const   size = {
    width: window.innerWidth,
    height: window.innerHeight,
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

function setupEvents() {
    ball.addEventListener('ongoal', (e) => {
        // HERE SCORE GEOMETRY
        // console.log('goal!!', e.message);
        const player = e.message === player1.name ? player1 : player2;
        // const player = e.player;
        // const geometry = player.se
        console.log('goal!! player name', player.name);
        // const mesh = playr.textMesh;
        // mesh.geometry.getAttribute('position').needsUpdate = true;
       })
    
    window.addEventListener("click", (event) => {
        if (gameStarted) return; // Ignore clicks after the game starts
    
        // Convert mouse position to normalized device coordinates (-1 to +1)
        cursor.x = (event.clientX / window.innerWidth) * 2 - 1;
        cursor.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Raycast to check for intersections
        ray.setFromCamera(cursor, camera);
        const intersects = ray.intersectObject(button);
        rayStart.setFromCamera(cursor, camera);
        const intersectsStart = rayStart.intersectObject(start);
    
        if (intersects.length > 0 || intersectsStart.length > 0) {
            console.log("3D Start Button Clicked!");
            if (gameStarted) return; // Prevent multiple starts
            gameStarted = true;
            start.visible = false; // Hide the button
            button.visible = false;
            // ball.reset();
            // animateAI();
        }
    });
    

}

function createButton() {
    const buttonGeo = new RoundedBoxGeometry(15, 5, 3, field.radius, field.seg * 10); // Button size
    const buttonMat = new THREE.MeshStandardMaterial({ 
        color: 0x9400D3,
        // metalness: 0.2,
        // roughness: 0.6
     }); // Violette button
    const buttonMesh = new THREE.Mesh(buttonGeo, buttonMat);
    buttonMesh.position.set(0, 20, 0); // Adjust position in the scene

    const loader = new FontLoader();
    loader.load('./three/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    const textGeo = new TextGeometry("START !", {
        font: font,
        size: 1.5,
        depth: 0.5,
        curveSegments: 12,
		bevelEnabled: true,
		bevelThickness: 0.02,
		bevelSize: 0.02,
		// bevelOffset: 0,
		bevelSegments: 3
    });
    textGeo.center();
    const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(0, 20, 1.5); // Center the text
    start = textMesh;
    
    scene.add(textMesh);

    });
    scene.add(buttonMesh);

    // const light = new THREE.PointLight(0xffffff, 10, 10);
    // light.position.set(30, 15, 20);
    // scene.add(light);
    
    button = buttonMesh; // Save reference for click detection
}

function animateIdle() {
    requestAnimationFrame(animateIdle);

    // Ensure paddles are visible in the static scene
    // player1.mesh.position.set(0, 0, limits.y - 1); // Adjust position
    // player2.mesh.position.set(0, 0, -limits.y + 1);

    // ball.mesh.position.set(0, 0, 0); // Keep ball in the center

    renderer.render(scene, camera);
}



