import * as THREE from "three";
import { CapsuleGeometry, MeshNormalMaterial, Vector3, Raycaster } from 'three';
import { SphereGeometry,  MeshBasicMaterial, 
    Mesh, MathUtils, EventDispatcher} from 'three';
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';


const paddle = {
    radius: 0.25,
    length: 5,
    capSeg: 20,
    radSeg: 20,
    speed: 0.5,
    color: "white",
    fontPath: "../three/examples/fonts/helvetiker_regular.typeface.json",
}

const ballParams = {
    speed: 25,
    velocity: new Vector3(1, 0, 0.5),
    radius: 0.5,
    color: "white",
}

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

const GEOMETRY = new CapsuleGeometry(paddle.radius, paddle.length, paddle.capSeg, paddle.radSeg);
GEOMETRY.rotateZ(Math.PI * 0.5)
// GEOMETRY.rotateY(Math.PI * 0.5)
const MATERIAL = new MeshNormalMaterial();

const HELPER_GEO = new CapsuleGeometry(paddle.radius + ballParams.radius, paddle.length, paddle.capSeg, 8)
HELPER_GEO.rotateZ(Math.PI * 0.5)
HELPER_GEO.rotateX(Math.PI / 8)

export class Player {

    speed = paddle.speed;
    color = paddle.color;
    loader = new FontLoader();
    textMesh = null;
    fontPath = paddle.fontPath;
    loadedFont = null;
    // velocity = new Vector3(0, 0, 1);

    constructor(limits, scene, role, name, position, ifAI) {
        this.limits = limits;
        this.ifAI = ifAI;
        this.up = false;
        this.down = false;
        this.score = 0;
        this.role = role; // 1 - right or -1 - left (AI)
        this.name = name;
        this.scene = scene;
        this.setText();
        this.initial = position;

        // Create the 3D paddle
        this.geometry = GEOMETRY; //new THREE.BoxGeometry(this.width, this.height, this.depth);
        this.material = MATERIAL; //new THREE.MeshBasicMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.collitionMesh = new THREE.Mesh(
            HELPER_GEO,
            new THREE.MeshNormalMaterial({ 
                transparent: true, 
                opacity: 0.5, 
                visible: false 
            }) 
        )
        this.mesh.add(this.collitionMesh);
        // Set paddle position
        this.mesh.position.copy(position);

        this.scene.add(this.mesh);
        if (!ifAI) {
            // Here will be this.setupText()
        } else {
            this.setupTextAI();
        }
    }

    resetPos() {
        this.mesh.position.copy(this.initial);
    }
    setupTextAI() {
    
        this.loader.load(this.fontPath, ( font ) => {
            this.loadedFont = font;
            const textGeo = this.createTextGeometry(this.loadedFont);
            // textGeo.center();
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
            this.textMesh.position.set(0, 3, (this.limits.y + 10) * this.role);
            this.scene.add(this.textMesh);
        } );
    }

    createTextGeometry(font) {
        const textGeo = new TextGeometry(this.text, {
                font: font,
                ...TEXT_PARAMS
        })
        textGeo.center();
        return textGeo;
    }

    setX(x) {
		if (x > this.limits.x - 3) {
			x = this.limits.x - 3
		} else if (x < -this.limits.x + 3) {
			x = -this.limits.x + 3
		}

		this.mesh.position.x = x
	}

    move() {
        // console.log(`limits.x: ${this.limits.x}, position.x: ${this.mesh.position.x}`)
        if (this.up && -1 * (this.mesh.position.x - paddle.length / 2) < this.limits.x) {
            this.mesh.position.x -= this.speed;
        }
        if (this.down && (this.mesh.position.x + paddle.length / 2) < this.limits.x) {
            this.mesh.position.x += this.speed;
        }
    }


    setText() {
        this.text = `${this.name} - ${this.score}`;
        if (this.role === 1 && this.ifAI) {
            this.text = `you - ${this.score}`
        }
    }

    scored() {
        this.score++;
        this.setText();
        // const geo = this.createTextGeometry(this.loadedFont);
        this.textMesh.geometry = this.createTextGeometry(this.loadedFont);
        this.textMesh.geometry.getAttribute('position').needsUpdate = true
    }

    // displayEndgameMessage(ctx, finalScore, msg) {
    //     ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    //     ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    //     ctx.fillStyle = "white";
    //     ctx.font = "50px Arial";
    //     ctx.textAlign = "center";
    //     ctx.fillText(msg, window.innerWidth / 2, window.innerHeight / 2 - 20);
    //     ctx.font = "40px Arial";
    //     ctx.fillText(finalScore, window.innerWidth / 2, window.innerHeight / 2 + 30);
    // }
}

export class Ball extends EventDispatcher {

    
    
    // tPos = null;
    
    constructor(scene, limits, players) {
        super();

        this.speed = ballParams.speed;
        this.velocity = ballParams.velocity;
        this.velocity = this.velocity.normalize();
        this.radius = ballParams.radius;
        this.color = ballParams.color;

        this.limits = limits;
        this.scene = scene;
        this.players = players;

        // this.pointCollision = new Mesh(new SphereGeometry(0.1), new MeshBasicMaterial({ color: 'red' }))

        this.geometry = new THREE.SphereGeometry(this.radius);
        this.material = new THREE.MeshNormalMaterial({ wireframe: false, flatShading: true });
        // change later for standard or phong material later
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(0, 0, 0);
        this.scene.add(this.mesh);
        this.velocity.multiplyScalar(this.speed);
        
        this.ray = new Raycaster();
        this.ray.near = 0;
        this.ray.far = limits.y * 2.5;
    }

    resetVelocity() {
        this.speed = ballParams.speed;
        this.velocity.z *= -1;
        this.velocity.normalize().multiplyScalar(this.speed);
    }

    resetPos() {
        this.mesh.position.set(0, 0, 0);
    }

    update(dt) {
    //     console.log(`Entered update: ${this.mesh.position.x}`);
        // console.log(`Velocity Length is: ${this.velocity.length()}`);
        // console.log(`Velocity is: ${this.velocity.x}x${this.velocity.y}x${this.velocity.z}`);
        // console.log(`Datatime is: ${dt}`);

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
                // player1.scored();
                // theplayer = this.players[0]
                console.log(`Player1 scored: ${this.players[0].score}`);
            } else {
                this.players[1].scored();
                // theplayer = this.players[1]
                // player2.scored();
                console.log(`Player2 scored: ${this.players[1].score}`);
            }

            // theplayer.scored();
            // const geo = theplayer
            const msg = this.mesh.position.z > 0 ? this.players[0].name : this.players[1].name;
            this.dispatchEvent({ type: 'ongoal', message: msg, player: this });
            tPos.set(0, 0, 0);
            this.resetVelocity();
        }

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

                this.speed *= 1.05;
                this.velocity = this.velocity.clone().normalize().multiplyScalar(this.speed);
                
            }
        }
        // } else {
        //     this.pointCollision.position.set(0, 0, 0);
        // }

        this.mesh.position.copy(tPos);
    }

    

}

export class AIController {
    constructor(paddle, target) {
        this.paddle = paddle;
        this.target = target;
        this.simplex = new SimplexNoise();
        this.time = 0;
    }

    update(dt) {

        let x = this.target.mesh.position.x;

        this.time += dt;
        const dx = this.simplex.noise2D(this.time * 0.5, 1) * 5.5;

        x = MathUtils.lerp(this.paddle.mesh.position.x, x + dx, 0.4)

        this.paddle.setX(x);
    }
}

