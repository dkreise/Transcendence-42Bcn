import * as THREE from "three";
import { Vector3, Raycaster } from 'three';
import { EventDispatcher} from 'three';
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
// import { TEXT_PARAMS } from "./3DPlayer";
import { params, field } from "./3DLocalGame.js";
// import { pause } from "./3DLocalGame.js";
// import { Player, AIPlayer, AIController } from './3DPlayer.js';

const TEXT_PARAMS = {
    size: 3,
    depth: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 5
}

export const ballParams = {
    speed: 25,
    velocity: new Vector3(-0.8, 0, -0.5),
    // velocity1: new Vector3(-0.8, 0, 0.5),
    radius: 0.7,
    color: 0x9400FF,//params.buttonColor,// 0xffaa00,//0xEAE900,//0xF5F045, //0x550055,
    maxScore: 2,
    fontPath: "../three/examples/fonts/helvetiker_regular.typeface.json",
}

export class Ball extends EventDispatcher {

    
    maxScore = ballParams.maxScore;
    // tPos = null;
    
    constructor(scene, limits, players, ifAI) {
        super(); // Calls the parent class constructor

        this.ai = ifAI;
        this.speed = ballParams.speed;
        // this.inicial = ballParams.velocity.normalize();
        this.velocity = ballParams.velocity.normalize();
        this.radius = ballParams.radius;
        this.color = ballParams.color;
        this.limits = limits;
        this.scene = scene;
        this.players = players;
        this.scored = -1;

        this.geometry = new THREE.SphereGeometry(this.radius);
        this.material = new THREE.MeshPhongMaterial({ 
            color: ballParams.color, 
            specular: 0xFFFFFF, 
            shininess: 100 });
        // change later for standard or phong material later
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.resetPos();
        this.scene.add(this.mesh);
        this.velocity.multiplyScalar(this.speed);
        
        this.ray = new Raycaster();
        this.ray.near = 0;
        this.ray.far = limits.y * 2.5;
        this.isPaused = false;
        // this.createCountdownText();
        this.loadedFont = null;
        // this.loader = new FontLoader();
    }

    // createCountdownText() {
    //     const loader = new FontLoader();
    //     loader.load(ballParams.fontPath, ( font ) => {
    //         this.loadedFont = font;
    //         const textGeo = this.createTextGeometry("3", this.loadedFont);
    //         this.countdownText = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
    //         this.countdownText.position.set(0, params.textY, 0);
    //         this.countdownText.visible = false;
    //         this.scene.add(this.countdownText);
    //     } );
    // }

    createTextGeometry(text, font) {
        const textGeo = new TextGeometry(text, {
                font: font,
                ...TEXT_PARAMS
        })
        textGeo.center();
        return textGeo;
    }

    resetVelocity() {
        this.speed = ballParams.speed;
        this.velocity = ballParams.velocity.normalize();
        // this.velocity.z *= this.scored;
        this.velocity.x *= this.scored;
        this.velocity.normalize().multiplyScalar(this.speed);
    }

    resetPos() {
        this.mesh.position.set(0, field.height, 0);
    }

    checkScore() {
        if (this.players[1].score < this.maxScore && this.players[0].score < this.maxScore) {
            return false;
        }
        
        const name = this.players[0].score >= this.maxScore ? this.players[0].name : this.players[1].name;
        const msg = `${name} won ${this.players[0].score}-${this.players[1].score} !`
        this.dispatchEvent({ type: 'aifinish', message: msg, player: name });
        return true;
    }

    update(dt, pause) {
    //     console.log(`Entered update: ${this.mesh.position.x}`);
        // console.log(`Velocity Length is: ${this.velocity.length()}`);
        // console.log(`Velocity is: ${this.velocity.x}x${this.velocity.y}x${this.velocity.z}`);
        // console.log(`Datatime is: ${dt}`);
        if (pause) {

            return;
        }

        const dir = this.velocity.clone().normalize();
        // console.log(`Direcetion: ${dir.toArray()}`);
        this.ray.set(this.mesh.position, dir);
        const s = this.velocity.clone().multiplyScalar(dt); // A displacement vector representing how far the object will move in this frame.
        const tPos = this.mesh.position.clone().add(s); // The target position of the moving object after applying the displacement.
        
        // console.log(`tPos 1: ${tPos.x}`);
        // collitions here
        const dx = this.limits.x - this.radius - Math.abs(this.mesh.position.x)
        const dz = this.limits.y - this.radius - Math.abs(this.mesh.position.z)

        // let theplayer;

        if (dx <= 0) {
            console.log('X hit!!');
            tPos.x = (this.limits.x - this.radius + dx) * Math.sign(this.mesh.position.x)
            this.velocity.x *= -1;
        }
        else if (dz < 0) {
            console.log('Z hit!!');
            if (this.mesh.position.z > 0) {
                this.players[0].scored();
                this.scored = -1;
                // player1.scored();
                // theplayer = this.players[0]
                console.log(`Player1 scored: ${this.players[0].score}`);
            } else {
                this.players[1].scored();
                this.scored = 1;
                // theplayer = this.players[1]
                // player2.scored();
                console.log(`Player2 scored: ${this.players[1].score}`);
            }

            // theplayer.scored();
            // const geo = theplayer
            if (!this.checkScore())
                this.onGoal();
            return ;
            // this.resetVelocity();
        }

        // if (this.isPaused) return;
        // Find the Paddle the Ball is Moving Towards:
        // Math.sign(paddle.mesh.position.z) checks if the paddle is on the positive or negative Z-axis.
        // Math.sign(this.velocity.z) checks if the ball is moving forward or backward along the Z-axis.
        const paddle = this.players.find((paddle) => {
            return Math.sign(paddle.mesh.position.z) === Math.sign(this.velocity.z);
        })
        // This ensures the code only checks for collisions with the paddle the ball is heading towards.
        // The paddle might have multiple child objects (e.g., visual components), and the ray checks all of them for intersections.
        // Destructures the first intersection from the array of intersected objects (if any).
        
        const [intersection] = this.ray.intersectObjects(paddle.mesh.children)

        if (intersection) {
            console.log(`Intersection: ${intersection}`);
            // this.pointCollision.position.copy(intersection.point);

        // Check If the Collision Happens Before the Ball Fully Moves
        //If the intersection distance is less than the intended movement:
        // A collision will occur within this frame, so the code handles the collision.
            if (intersection.distance < s.length()) {
                console.log('Collision with paddle');

                // Handle the Collision (Bounce Effect):
                tPos.copy(intersection.point); // Move the ball to the exact collision point
                const d = s.length() - intersection.distance; // Remaining distance after the collision
                const normal = intersection.normal; // Get the surface normal at the point of collision
                normal.y = 0; // Prevent vertical reflections (lock movement in the XZ)
                normal.normalize(); // Normalize the normal vector to ensure it has a unit length for accurate reflection
                // Reflect the velocity to simulate a bounce
                // Reflects the ball's velocity vector across the paddle's surface normal, causing it to bounce off in the opposite direction.
                this.velocity.reflect(normal); // Reflect velocity (bounce off)
                const dS = this.velocity.clone().normalize().multiplyScalar(d); // Remaining movement after bouncing
                tPos.add(dS); // Move the ball the remaining distance in the new direction

                this.speed *= 1.1;
                this.velocity = this.velocity.clone().normalize().multiplyScalar(this.speed);
                
            }
        }

        this.mesh.position.copy(tPos);
    }

    onGoal() {
        console.log("Goal! Pausing ball...");

        this.resetPos();
        this.dispatchEvent({ type: 'aipause'});
    }
}

