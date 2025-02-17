import * as THREE from "three";
import { CapsuleGeometry, MeshNormalMaterial } from 'three';
import { MathUtils} from 'three';
import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
import { ballParams } from "./3DBall.js";
import { field } from "./3DLocalGame.js";
import { EventDispatcher } from "../three/build/three.core.js";

export const paddle = {
    radius: 0.5,
    length: 5,
    capSeg: 20,
    radSeg: 20,
    speed: 0.6,
    color: 0x7C62A0, //0x550055,
    fontPath: "../three/examples/fonts/helvetiker_regular.typeface.json",
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
const TEXT_PARAMS_AI = {
    size: 2,
    depth: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 5
}

const TEXT_PARAMS_NAME = {
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

const HELPER_GEO = new CapsuleGeometry(paddle.radius + ballParams.radius, paddle.length + 0.5, paddle.capSeg, 8)
HELPER_GEO.rotateZ(Math.PI * 0.5)
HELPER_GEO.rotateX(Math.PI / 8)

export class Player {

    constructor(limits, scene, role, name, position, rotationX = 0, rotationY = 0, rotationZ = 0) {
        this.speed = paddle.speed;
        this.color = paddle.color;
        this.loader = new FontLoader();
        this.textMesh = null;
        this.textName = null;
        this.fontPath = paddle.fontPath;
        this.loadedFont = null;
        this.limits = limits;
        // this.ifAI = ifAI;
        this.up = false;
        this.down = false;
        this.score = 0;
        this.role = role; // 1 - right or -1 - left (AI)
        this.name = name;
        // console.log(`My name is ${this.name}`)
        // console.log(`Originally ${name}`)
        this.scene = scene;
        this.text = `${this.score}`;
        this.initial = position;
        this.initial.y += field.height;

        this.rotationX = rotationX;
        this.rotationY = rotationY;
        this.rotationZ = rotationZ;
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
        this.mesh.position.copy(this.initial);
        this.scene.add(this.mesh);
        this.setupText(TEXT_PARAMS);
    }

    resetAll() {
        this.score = 0;
        this.setText();
        this.textMesh.geometry = this.createTextGeometry(this.text, this.loadedFont, TEXT_PARAMS);
        
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;
        this.textMesh.geometry.getAttribute('position').needsUpdate = true;
        this.resetPos;
    }

    resetPos() {
        this.mesh.position.copy(this.initial);
    }
    setupText(params) {
        this.loader.load(this.fontPath, ( font ) => {
            this.loadedFont = font;
            const textGeo = this.createTextGeometry(this.text, this.loadedFont, TEXT_PARAMS);
            // textGeo.rotateY(-Math.PI * this.rotationY)
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({ color: paddle.color }));
            const geoName = this.createTextGeometry(this.name, this.loadedFont, TEXT_PARAMS_NAME);
            this.textName = new THREE.Mesh(geoName, new THREE.MeshStandardMaterial({ color: paddle.color }));
            this.textMesh.castShadow = true;
            this.textMesh.receiveShadow = true;
            this.textMesh.position.set(field.x + 3, 8, (this.limits.y - 5) * this.role);
            this.textName.castShadow = true;
            this.textName.receiveShadow = true;
            this.textName.position.set(field.x + 3, 12, (this.limits.y - 7) * this.role);
            this.scene.add(this.textMesh, this.textName);
        } );
    }

    createTextGeometry(text, font, params) {
        const textGeo = new TextGeometry(text, {
                font: font,
                ...params
        })
        textGeo.center();
        // textGeo.setRotationFromEuler(new THREE.Euler(this.rotationX, this.rotationY, this.rotationZ, "ZYX"));
        // textGeo.rotateY(-Math.PI * this.rotationY)
        textGeo.rotateX(Math.PI * this.rotationX);
        textGeo.rotateY(Math.PI * this.rotationY);
        textGeo.rotateZ(Math.PI * this.rotationZ);
        // console.log(`Players creating Text: ${this.rotationX}x${this.rotationY}x${this.rotationZ}`)
        return textGeo;
    }

    move() {
        // console.log(`The arrow left is ${this.down}, mesh pos is ${this.mesh.position.x - paddle.length / 2}, limits are ${this.limits.x * -1 + 0.5}`)
        if (this.down && ((this.mesh.position.x - paddle.length / 2) > (this.limits.x * -1 + 0.75))) {
            // console.log("Move 2 down, arrow left");
            this.mesh.position.x -= this.speed;
        }
        if (this.up && (this.mesh.position.x + paddle.length / 2) < this.limits.x - 0.75) {
            // console.log("Move 2 up, arrow right");
            this.mesh.position.x += this.speed;
        }
    }


    setText() {
        // Reload in AI
        this.text = `${this.score}`;
    }

    scored() {
        this.score++;
        // this.text = `${this.name} - ${this.score}`;
        this.setText();
        this.textMesh.geometry = this.createTextGeometry(this.text, this.loadedFont, TEXT_PARAMS);
        
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;
        this.textMesh.geometry.getAttribute('position').needsUpdate = true;
    }

    getType() {
        return ("localfinish");
    }
}

export class AIPlayer extends Player {

    constructor(limits, scene, role, name, position, rotationX = 0, rotationY = 0, rotationZ = 0) {
        super(limits, scene, role, name, position, rotationX, rotationY, rotationZ);
        this.setText(TEXT_PARAMS);
        // console.log(`My text is ${this.text}, my role is: ${this.text}`);


    }

    setupText(params) {
    // this is the ai version - to be reloaded in AI
        this.loader.load(this.fontPath, ( font ) => {
            this.loadedFont = font;
            const textGeo = this.createTextGeometry(this.text, this.loadedFont, params);
            // textGeo.rotateX(Math.PI * 0.5)
            // textGeo.rotateX(-Math.PI * 0.1)
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial({ color: paddle.color }));
            this.textMesh.castShadow = true;
            this.textMesh.receiveShadow = true;
            this.textMesh.position.set(0, 3, (this.limits.y + 10) * this.role);
            this.scene.add(this.textMesh);
        } );
    }

    setX(x) {
		if (x > this.limits.x - 3) {
			x = this.limits.x - 3
		} else if (x < -this.limits.x + 3) {
			x = -this.limits.x + 3
		}

		this.mesh.position.x = x
    }

    setText() {
        this.text = `${this.name} - ${this.score}`;
        if (this.role === 1) {
            this.text = `you - ${this.score}`
        }
    }

    scored() {
        this.score++;
        // this.text = `${this.name} - ${this.score}`;
        this.setText();
        this.textMesh.geometry = this.createTextGeometry(this.text, this.loadedFont, TEXT_PARAMS);
        
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;
        this.textMesh.geometry.getAttribute('position').needsUpdate = true;
    }

    getType() {
        return ("aifinish");
    }

}

export class AIController {
    constructor(paddle, target, limits) {
        this.paddle = paddle;
        this.target = target;
        this.simplex = new SimplexNoise();
        this.time = 0;
        // this.targetX = this.paddle.mesh.position.x;
        this.targetX = this.paddle.mesh.position.x; // Store last target position
        this.lastUpdateTime = 0;
        this.maxSpeed = paddle.speed;
        this.limits = limits;
        // console.log(`LimitX is ${limits.x}, LimitY is ${limits.y}`)
        this.difficulty = 3; // 0.5-1 => easy, 3 => already low chance for ai to lose, 5 => almost impossible; 
        this.errorRange = (limits.y / 10) * (2 / this.difficulty); 
    }

    update(elapsedTime) {
        // AI updates its target position only every second
        if (elapsedTime - this.lastUpdateTime >= 1 ) {
            this.doMovesAI();

            // Update last update time
            this.lastUpdateTime = elapsedTime;
        }
        this.checkIfAIneedStop();
        this.paddle.move();

    }

    getTimeToTopBottom(yspeed, y) {
        if (yspeed > 0) {
            // Ball is moving up → Time to reach the top wall (15)
            return (this.limits.x - y - this.target.radius) / yspeed;
        } else {
            // Ball is moving down → Time to reach the bottom wall (-15)
            return (y + this.limits.x - this.target.radius) / -yspeed;
        }
    }
    
    // when the ball will hit the left or right walls
    getTimeToLeftRight(xspeed, x) {
        if (xspeed > 0) {
            // Ball is moving right → Time to reach the right wall
            return (this.limits.y - 2 - x - this.target.radius) / xspeed; // right wall
        } else {
            // Ball is moving left → Time to reach the left wall
            return (x + this.limits.y - 2 - this.target.radius) / -xspeed; // left wall
        }             
    }
    

    // ball.zspeed > 0 => right, < 0 => left
    // ball.xspeed > 0 => down, < 0 => up
    predictBallX() {
        let tempZ = this.target.mesh.position.z;
        let tempX = this.target.mesh.position.x;
        let tempZspeed = this.target.velocity.z;
        let tempXspeed = this.target.velocity.x;
        // console.log(`tempX is ${tempX}, tempY is ${tempY}`)
        // console.log(`tempXspeed is ${tempXspeed}, tempYspeed is ${tempYspeed}`)
        // if the ball is going toward opposite wall => return random just for moving & replicating human behaviour
        if (tempZspeed > 0)
            return Math.floor(Math.random() * (this.limits.x * 2 + 1)); //null;
        //  return Math.random() * (this.limits.x * 2) - this.limits.x; // null
        let timeToTopBottom = this.getTimeToTopBottom(tempXspeed, tempX);
        let timeToLeftRight = this.getTimeToLeftRight(tempZspeed, tempZ);
        // console.log(`timeToTopBottom is ${timeToTopBottom}, timeToLeftRight is ${timeToLeftRight}`)
        while (timeToTopBottom < timeToLeftRight) {
            tempZ = tempZ + tempZspeed * timeToTopBottom;
            if (tempXspeed < 0) {
                tempX = -Math.abs(this.limits.x) + this.target.radius;
                //tempX = 0; //ball.radius;
            } else {
                tempX = Math.abs(this.limits.x) - this.target.radius;
                // tempX = this.limits.x - this.target.radius;
            }
            tempXspeed = -tempXspeed;
    
            timeToTopBottom = this.getTimeToTopBottom(tempXspeed, tempX);
            timeToLeftRight = this.getTimeToLeftRight(tempZspeed, tempZ);
        }
    
        tempX = tempX + tempXspeed * timeToLeftRight;
    
        let error = Math.random() * this.errorRange - this.errorRange ;/// 2;  // Random error between ±errorRange/2
        // return Math.max(-this.limits.x, Math.min(this.limits.x, tempX));
        return Math.max(-this.limits.x, Math.min(this.limits.x, tempX + error));
        // return tempX;
    }

    doMovesAI() {
   
        // console.log("doing it each sec");
        this.targetX = this.predictBallX();
        // console.log(`TargetX is ${this.targetX}`)
        if (this.targetX === null)   return;
    
        if (this.targetX  < this.paddle.mesh.position.x - paddle.length / 2) {
            // console.log("Entered first if");
            // console.log(`paddle pos ${this.paddle.mesh.position.x}`);
            this.paddle.up = false;
            this.paddle.down = true;
        } else if (this.targetX  > this.paddle.mesh.position.x + paddle.length / 2) {
            // console.log("Entered second if");
            // console.log(`paddle pos ${this.paddle.mesh.position.x}`);
            this.paddle.down = false;
            this.paddle.up = true;
        } else {
            // console.log("Entered else");
            // console.log(`paddle pos ${this.paddle.mesh.position.x}`);
            this.paddle.up = false;
            this.paddle.down = false;
        }
    }
    
    checkIfAIneedStop() {
        if (this.targetX) {
            if (this.paddle.up && this.paddle.mesh.position.x + (paddle.length / 2) >= this.targetX) {
                this.paddle.up = false;
            } else if (this.paddle.down && this.paddle.mesh.position.x - (paddle.length / 2) <= this.targetX) {
                this.paddle.down = false;
            }
        }
    }
}
