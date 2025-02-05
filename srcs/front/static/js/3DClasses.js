import * as THREE from "three";
import { CapsuleGeometry, MeshNormalMaterial, Vector3, Raycaster } from 'three';
import { SphereGeometry,  MeshBasicMaterial, 
    Mesh, MathUtils, EventDispatcher} from 'three';


const paddle = {
    radius: 0.25,
    length: 5,
    capSeg: 20,
    radSeg: 20,
    speed: 0.5,
    color: "white",
}

const ballParams = {
    speed: 25,
    velocity: new Vector3(1,0,0.5),
    radius: 0.5,
    color: "white",
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
    // velocity = new Vector3(0, 0, 1);

    constructor(limits, scene, role, name, position) {
        this.limits = limits;
        this.up = false;
        this.down = false;
        this.score = 0;
        this.role = role; // 1 - right or 0 - left
        this.name = name;
        this.scene = scene;

        // Create the 3D paddle
        this.geometry = GEOMETRY //new THREE.BoxGeometry(this.width, this.height, this.depth);
        this.material = MATERIAL //new THREE.MeshBasicMaterial({ color: this.color });
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

    // update(newScore) {
	// 	this.score = newScore;
	// }

    // drawScore(ctx) {
    //     ctx.fillStyle = 'white';
    //     ctx.font = '20px Arial';
    //     if (this.role === 0) {
    //         ctx.fillText(`${this.name}: ${this.score}`, 20, 20);
    //     } else {
    //         ctx.fillText(`${this.name}: ${this.score}`, window.innerWidth - 150, 20);
    //     }
    // }

    scored() {
        this.score++;
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

export class Ball {

    speed = ballParams.speed;
    velocity = ballParams.velocity;
    radius = ballParams.radius;
    color = ballParams.color;
    ray = new Raycaster();
    // tPos = null;
    
    constructor(scene, limits, players) {
        // super();

        this.limits = limits;
        this.scene = scene;
        this.players = players;
        this.ray.near = 0;
        this.ray.far = limits.y * 2.5;
        this.pointCollision = new Mesh(new SphereGeometry(0.1), new MeshBasicMaterial({ color: 'red' }))

        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshNormalMaterial({ wireframe: false, flatShading: true });
        // change later for standard or phong material later
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.velocity.multiplyScalar(this.speed);
        this.scene.add(this.mesh, this.pointCollision);
    }

    resetVelocity() {
        this.speed = ballParams.speed;
        this.velocity.z *= -1;
        this.velocity.normalize().multiplyScalar(this.speed);
    }

    update(dt) {

        const dir = this.velocity.clone().normalize();
        this.ray.set(this.mesh.position, dir);
        const s = this.velocity.clone().multiplyScalar(dt); // A displacement vector representing how far the object will move in this frame.
        const tPos = this.mesh.position.clone().add(s); // The target position of the moving object after applying the displacement.

        // collitions here
        const dx = this.limits.x - this.radius - Math.abs(this.mesh.position.x)
        const dz = this.limits.y - this.radius - Math.abs(this.mesh.position.z)

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
                console.log(`Player1 scored: ${this.players[0].score}`);
            } else {
                this.players[1].scored();
                // player2.scored();
                console.log(`Player2 scored: ${this.players[1].score}`);
            }
            const msg = this.mesh.position.z > 0 ? this.players[0].name : this.players[1].name;
            // this.dispatchEvent({ type: 'ongoal', message: msg });
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
            this.pointCollision.position.copy(intersection.point);

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
                this.velocity.normalize().multiplyScalar(this.speed);
                
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