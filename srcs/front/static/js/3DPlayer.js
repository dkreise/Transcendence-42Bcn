import * as THREE from "three";
import { CapsuleGeometry, MeshNormalMaterial } from 'three';
import { MathUtils} from 'three';
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
import { ballParams } from "./3DBall.js";
import { field } from "./3DLocalGame.js";

export const paddle = {
    radius: 0.5,
    length: 5,
    capSeg: 20,
    radSeg: 20,
    speed: 0.5,
    color: 0x7C62A0, //0x550055,
    fontPath: "../three/examples/fonts/helvetiker_regular.typeface.json",
}

const TEXT_PARAMS = {
    size: 2,
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
const MATERIAL = new THREE.MeshPhongMaterial({ 
    color: paddle.color,
    specular: 0xFFFFFF, 
    shininess: 100 });

const HELPER_GEO = new CapsuleGeometry(paddle.radius + ballParams.radius, paddle.length, paddle.capSeg, 8)
HELPER_GEO.rotateZ(Math.PI * 0.5)
HELPER_GEO.rotateX(Math.PI / 8)

export class Player {

    constructor(limits, scene, role, name, position) {
        this.speed = paddle.speed;
        this.color = paddle.color;
        this.loader = new FontLoader();
        this.textMesh = null;
        this.fontPath = paddle.fontPath;
        this.loadedFont = null;
        this.limits = limits;
        // this.ifAI = ifAI;
        this.up = false;
        this.down = false;
        this.score = 0;
        this.role = role; // 1 - right or -1 - left (AI)
        this.name = name;
        console.log(`My name is ${this.name}`)
        console.log(`Originally ${name}`)
        this.scene = scene;
        this.text = `${this.name} - ${this.score}`;
        // this.setText();
        this.initial = position;
        this.initial.y += field.height;

        // Create the 3D paddle
        this.geometry = GEOMETRY; //new THREE.BoxGeometry(this.width, this.height, this.depth);
        this.material = MATERIAL; //new THREE.MeshBasicMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
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
        this.mesh.position.copy(this.initial);

        this.scene.add(this.mesh);
        this.setupText();
    }

    resetTeam() {
        this.score = 0;
        this.setText();
        this.resetPos;
    }

    resetPos() {
        this.mesh.position.copy(this.initial);
    }
    setupText() {
    // this is the ai version - to be reloaded in AI
        this.loader.load(this.fontPath, ( font ) => {
            this.loadedFont = font;
            const textGeo = this.createTextGeometry(this.loadedFont);
            // textGeo.center();
            // textGeo.rotateY(-Math.PI * 0.3)
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({ color: paddle.color }));
            this.textMesh.castShadow = true;
            this.textMesh.receiveShadow = true;
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
        // Reload in AI
        this.text = `${this.name} - ${this.score}`;
    }

    scored() {
        this.score++;
        // this.text = `${this.name} - ${this.score}`;
        this.setText();
        this.textMesh.geometry = this.createTextGeometry(this.loadedFont);
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;
        this.textMesh.geometry.getAttribute('position').needsUpdate = true;
    }
}

export class AIPlayer extends Player {

    constructor(limits, scene, role, name, position) {
        super(limits, scene, role, name, position);
        this.setText();
        console.log(`My text is ${this.text}, my role is: ${this.text}`)
    }

    setupText() {
    // this is the ai version - to be reloaded in AI
        this.loader.load(this.fontPath, ( font ) => {
            this.loadedFont = font;
            const textGeo = this.createTextGeometry(this.loadedFont);
            // textGeo.center();
            // textGeo.rotateX(Math.PI * 0.5)
            textGeo.rotateX(-Math.PI * 0.1)
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({ color: paddle.color }));
            this.textMesh.castShadow = true;
            this.textMesh.receiveShadow = true;
            this.textMesh.position.set(0, 3, (this.limits.y + 10) * this.role);
            this.scene.add(this.textMesh);
        } );
    }

    setX(x) {
        // ONLY AI
		if (x > this.limits.x - 3) {
			x = this.limits.x - 3
		} else if (x < -this.limits.x + 3) {
			x = -this.limits.x + 3
		}

		this.mesh.position.x = x
	}

    setText() {
        // Reload in AI
        this.text = `${this.name} - ${this.score}`;
        if (this.role === 1) {
            this.text = `you - ${this.score}`
        }
    }

}

export class AIController {
    constructor(paddle, target) {
        this.paddle = paddle;
        this.target = target;
        this.simplex = new SimplexNoise();
        this.time = 0;
        this.targetX = this.paddle.mesh.position.x; // Store last target position
        // this.lastUpdateTime = 0;
    }

    // Called every second to set a new target position
    setTarget(ball) {
        this.targetX = ball.mesh.position.x; // Get the ball's current X position
    }

    update(dt) {

        // let x = this.target.mesh.position.x;
        this.time += dt;
        const dx = 0;
        // const dx = this.simplex.noise2D(this.time * 0.2, 1) * 2.0;
        const x = MathUtils.lerp(this.paddle.mesh.position.x, this.targetX + dx, 0.2)
        this.paddle.setX(x);
    }
}
