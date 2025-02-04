import { makeAuthenticatedRequest } from "./login.js";
// // import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Ball, Player } from "./3DClasses.js";
import * as THREE from "three";

var baseUrl = "http://localhost"; // change (parse) later

let renderer, scene, camera, animationId, cube, canvas;
let limits, planeGeo, planeMat, plane, controls;

const clock = new THREE.Clock();
const ray = new THREE.Raycaster();

export const field = {
    x: 15,
    y: 20,
    width: 0.5,
    height: 2,
    // depth: limits.y * 2,
    radius: 5,
    seg: 0.25
}

// cursor
// const cursor = new THREE.Vector2(0,0);

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
            console.log('Local game returned!');
            // document.getElementById('content-area').innerHTML = data.game_html;
            // document.getElementById('content-area').innerHTML = "";
            // const canvas = document.getElementById("newGameCanvas");
            // if (canvas)
                // threeGame();
            startLocalGame(data['player1'], data['player2'], data['main_user']);
            // else
            //     console.log("Error: Canvas not found");

        } else {
            console.log('Response: ', data);
            console.error('Failed to fetch the local game:', data.error);
        }
    })
    .catch(error => {
        console.error('Catch error loading local game: ', error);
    });
 
}

// function threeGame() {
//    // Create a scene
//    const scene = new THREE.Scene();

//    // Set up a camera (PerspectiveCamera: FOV, aspect ratio, near, far)
//    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//    camera.position.z = 5;

//    // Create a WebGL renderer
//    const renderer = new THREE.WebGLRenderer();
//    renderer.setSize(window.innerWidth, window.innerHeight);
//    const contentArea = document.getElementById("newGameCanvas");
// //    contentArea.innerHTML = '';
// //    document.body.appendChild(renderer.domElement);

//    // Add a cube (geometry, material, and mesh)
//    const geometry = new THREE.BoxGeometry();
//    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//    const cube = new THREE.Mesh(geometry, material);
//    scene.add(cube);

//    // Animation loop
//    function animate() {
//        animationId = requestAnimationFrame(animate);
//        cube.rotation.x += 0.01;
//        cube.rotation.y += 0.01;
//        renderer.render(scene, camera);
       
//    }
//    // // Start the animation
//    animate();
// }



// Game Initialization
// let canvas = null;
let ctx = null;
let player1 = null;
let player2 = null;
let mainUser = null; // if the main user is player 1 or 2
let ball = null;
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
function gameLocalLoop() {
   
    const deltaTime = clock.getDelta();
    
    ray.setFromCamera(player1.mesh.position, camera);
    const [intersection] = ray.intersectObject(plane);

    if (intersection) {
        const nextX = intersection.point.x;
        const prevX = player1.mesh.position.x;
        player1.mesh.position.x = THREE.MathUtils.lerp(prevX, nextX, 0.1);
    }
    // 1:19:19 

    ball.update(deltaTime);
    controls.update();  // Required if you have damping enabled
    // Update scene and render
    renderer.render(scene, camera);
    gameLoopId = requestAnimationFrame(gameLocalLoop);
    // // Draw players and ball
    // player1.draw(ctx);
    // player2.draw(ctx);
    // ball.draw(ctx);

    // console.log('In local game loop!');

    // Draw scores
    // player1.drawScore(ctx);
    // player2.drawScore(ctx);

    // Move players and ball
    player1.move();
    player2.move();
    // ball.move(player1, player2);

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

// Start game function
export function startLocalGame(playerName1, playerName2, mainUserNmb) {
    // Set up scene
    // canvas = document.getElementById("newGameCanvas");
    // canvas.width = window.innerWidth * 0.65; // % of screen width
    // canvas.height = canvas.width * 0.5; // % of screen height
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
    camera.position.set(45, 20, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(size.width, size.height);
    document.getElementById('content-area').appendChild(renderer.domElement);

    mainUser = mainUserNmb;

    setupField();
    // Initialize players and ball
    // console.log('Starting local game...');
    // console.log(`Canvas: ${canvas.width} x ${canvas.height}`);
    player1 = new Player(limits, scene, 0, playerName1, new THREE.Vector3(0, 0, field.y - 2));
    player2 = new Player(limits, scene, 1, playerName2, new THREE.Vector3(0, 0, -field.y + 2));
    ball = new Ball(scene, limits, [player1, player2]);
    controls = new OrbitControls(camera, renderer.domElement);
    setupControls();
    gameLocalLoop();
    // Initialize Three.js (3D Mode)
    // initThreeJS();
}

function setupField() {
    limits = new THREE.Vector2(field.x, field.y);
    planeGeo = new THREE.PlaneGeometry(
        limits.x * 2,
        limits.y * 2,
        limits.x * 2,
        limits.y * 2
    );

    planeGeo.rotateX(Math.PI * 0.5);
    planeMat = new THREE.MeshNormalMaterial({ wireframe: true, transparent: true, opacity: 0.7 });

    plane = new THREE.Mesh(planeGeo, planeMat);
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

//  Initialize Three.js Scene
// function initThreeJS() {
//     scene = new THREE.Scene();
//     camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
//     renderer = new THREE.WebGLRenderer({ antialias: true });

//     renderer.setSize(canvas.width, canvas.height);
//     document.getElementById("game-container").appendChild(renderer.domElement);

//     //  Create a 3D Ball
//     const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
//     const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
//     const threeBall = new THREE.Mesh(ballGeometry, ballMaterial);
//     scene.add(threeBall);

//     // 📷 Position Camera
//     camera.position.z = 5;

//     // 🔄 Three.js Animation Loop
//     function animate() {
//         requestAnimationFrame(animate);
//         threeBall.rotation.x += 0.01;
//         threeBall.rotation.y += 0.01;
//         renderer.render(scene, camera);
//     }

//     animate();
// }