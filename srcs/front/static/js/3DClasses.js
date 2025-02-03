import * as THREE from "three";
import { CapsuleGeometry, MeshNormalMaterial } from 'three';
import { Vector3 } from 'three';

const GEOMETRY = new CapsuleGeometry(0.25,5,20,20);
GEOMETRY.rotateZ(Math.PI * 0.5)
// GEOMETRY.rotateY(Math.PI * 0.5)
const MATERIAL = new MeshNormalMaterial();

export class Player {

    speed = 0.5;
    velocity = new Vector3(0, 0, 1);

    constructor(canvas, scene, role, name, position) {
        this.width = window.innerWidth * 0.01;
        this.height = window.innerWidth * 0.1;
        this.depth = this.width; // Depth for the 3D paddle
        // this.width = 1;  // 3D width of the paddle
        // this.height = 5; // 3D height of the paddle
        // this.depth = 1;  // Depth for the 3D paddle
        if (!role) {
            this.x = -window.innerWidth * 0.65 / 2;
        } else {
            this.x = window.innerWidth * 0.65  / 2 - this.width;
        }
        console.log(`player width: ${this.x}`)
        // this.y = canvas.height / 2 - this.height / 2;
        // this.z = 1; // Depth (optional)
        this.y = 0; // Vertical center
        this.z = 0; // Depth (optional)
        this.color = "white";
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

        // Set paddle position
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    // draw(ctx) {
    //     ctx.fillStyle = this.color;
    //     ctx.fillRect(this.x, this.y, this.width, this.height);
    // }

    move() {
        if (this.up) {
            this.mesh.position.x -= this.speed;
        }
        if (this.down) {
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

    speed = 9;
    velocity = new Vector3(1,0,0.5)
    
    constructor(scene, limits) {
        this.radius = 0.5; // 3D radius
        this.limits = limits;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.xspeed = 0.1;
        this.yspeed = 0.1;
        this.zspeed = 0.1; // Optional depth speed
        this.color = "white";
        this.scene = scene;

        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshNormalMaterial({ wireframe: false, flatShading: true });
        // change for standard or phong material later
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.velocity.multiplyScalar(this.speed);
        // this.ball.position.set(this.x, this.y, this.z);
        this.scene.add(this.mesh);
    }

    update(dt) {
        const s = this.velocity.clone().multiplyScalar(dt);
        const tPos = this.mesh.position.clone().add(s);

        // collitions here
        const dx = this.limits.x - this.radius - Math.abs(this.mesh.position.x)
        const dz = this.limits.y - this.radius - Math.abs(this.mesh.position.z)

        if (dx <= 0) {
            console.log('X hit!!');
            tPos.x = (this.limits.x - this.radius + dx) * Math.sign(this.mesh.position.x)
            this.velocity.x *= -1;
        }
        if (dz <= 0) {
            console.log('Z hit!!');
            tPos.set(0, 0, 0);
            this.velocity.z *= -1;
        }
        this.mesh.position.copy(tPos);
    }

    // draw(ctx) {
    //     ctx.fillStyle = this.color;
    //     ctx.beginPath();
    //     ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    //     ctx.fill();
    // }

    resetPosition() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.xspeed = -this.xspeed;
    }

    move(player1, player2) {
        this.x += this.xspeed;
        this.y += this.yspeed;
        this.z += this.zspeed;

        // Top and bottom wall collision
        if (this.y + this.radius >= window.innerHeight || this.y - this.radius <= 0) {
            this.yspeed = -this.yspeed;
        }

        // Left and right wall collision
        if (this.x + this.radius >= window.innerWidth || this.x - this.radius <= 0) {
            this.xspeed = -this.xspeed;
        }

        // Paddle collision check (use 3D logic here)
        if (
            (this.x - this.radius <= player1.paddle.position.x + player1.width &&
            this.y >= player1.paddle.position.y - player1.height / 2 &&
            this.y <= player1.paddle.position.y + player1.height / 2)
            ||
            (this.x + this.radius >= player2.paddle.position.x - player2.width &&
            this.y >= player2.paddle.position.y - player2.height / 2 &&
            this.y <= player2.paddle.position.y + player2.height / 2)
        ) {
            this.xspeed = -this.xspeed;
        }

        // Scoring conditions
        if (this.x - this.radius <= 0) {
            player2.scored();
            this.resetPosition();
        } else if (this.x + this.radius >= window.innerWidth) {
            player1.scored();
            this.resetPosition();
        }
    }
}