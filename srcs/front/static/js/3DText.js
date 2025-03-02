import * as THREE from "three";

import { TextGeometry } from '../three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../three/examples/jsm/loaders/FontLoader.js';
import { params, field,  } from "./3DLocalGame.js";
import { RoundedBoxGeometry } from '../three/examples/jsm/geometries/RoundedBoxGeometry.js'


export const textParams = {
    size: 1.5,
    depth: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
}

export const textWinner = {
    size: 2,
    depth: 0.5,
    curveSegments: 30,
}

export class SceneText {

    constructor(scene, dict, rotationX = 0, rotationY = 0, rotationZ = 0) {
        this.scene = scene;
        this.loader = new FontLoader();
        this.fontPathRegular = "../three/examples/fonts/helvetiker_regular.typeface.json";
        this.fontPathBold = "../three/examples/fonts/helvetiker_regular.typeface.json";
        this.loadedBoldFont = null;
        this.dict = dict;
        this.rotationX = rotationX;
        this.rotationZ = rotationZ;
        this.rotationY = rotationY;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.button = this.createButton();
        this.start = null;
        this.tryAgain = null;
        this.winnerMessage = null;
        this.countdownText = null;
        this.waiting = null;
        this.enemy = null;
        this.group.add(this.button);
        this.group.setRotationFromEuler(new THREE.Euler(this.rotationX, this.rotationY, this.rotationZ, "ZYX"));
    }

    createButton() {
        const buttonGeo = new RoundedBoxGeometry(15, 5, 3, field.radius, field.seg * 3); // Button size
        const buttonMat = new THREE.MeshPhongMaterial({ 
            color: params.buttonColor,
            specular: 0xFFFFFF, 
            shininess: 100,
            });
        const button = new THREE.Mesh(buttonGeo, buttonMat);
        // button.castShadow = true;
        // button.receiveShadow = true;
        button.position.set(0, params.textY, 0); // Adjust position in the scene
        return button;
    }

    async createText() {
        this.loadedBoldFont = await this.loadFont(this.fontPathBold);
        this.start = this.createButtonText(this.dict['start'], this.loadedBoldFont);
        this.tryAgain = this.createButtonText(this.dict['try_again'], this.loadedBoldFont);
        this.tryAgain.visible = false;
        const textGeo = this.createTextGeometry("3", this.loadedBoldFont, textWinner);
        this.countdownText = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
        this.countdownText.position.set(0, params.textY, 0);
        this.countdownText.visible = false;
        const waitingGeo = this.createTextGeometry("Waiting for enemy ...", this.loadedBoldFont, textWinner);
        this.waiting = new THREE.Mesh(waitingGeo, new THREE.MeshNormalMaterial());
        this.waiting.position.set(0, params.textY, 1.5);
        this.waiting.visible = false;
        const enemyGeo = this.createTextGeometry("Found an enemy!", this.loadedBoldFont, textWinner);
        this.enemy = new THREE.Mesh(enemyGeo, new THREE.MeshNormalMaterial());
        this.enemy.position.set(0, params.textY, 1.5);
        this.enemy.visible = false;
        this.winnerMessage = this.createWinnerMessage("winner", this.loadedBoldFont)
        this.winnerMessage.visible = false;
        this.group.add(this.start, this.tryAgain, this.enemy, this.waiting, this.countdownText, this.winnerMessage);

    }

    loadFont(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(path, (font) => {
                console.log("Font loaded");
                resolve(font);  // Resolve with the loaded font
            }, undefined, (error) => {
                console.error("Font loading failed", error);
                reject(error);  // Reject if there's an error
            });
        });
    }

    createButtonText(text, font) {
        const textGeo = this.createTextGeometry(text, font, textParams);
        const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(0, params.textY, 1.5); // Center the text
        return textMesh;
    }

    createTextGeometry(msg, font, textParams) {
        const textGeo = new TextGeometry(msg, {
                font: font,
                ...textParams
        })
        textGeo.center();
        return textGeo;
    }

    createWinnerMessage(msg, font) {
        const textGeo = this.createTextGeometry(msg, font, textWinner);
        const textMat = new THREE.MeshNormalMaterial();
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(0, params.textY + 5, 1.5); // Center the text
        return textMesh;

    }

    updateGeometry(mesh, msg, params) {
        mesh.geometry = this.createTextGeometry(msg, this.loadedBoldFont, params);
        mesh.geometry.getAttribute('position').needsUpdate = true;
    }
}

export class RemoteSceneText extends SceneText {

    constructor(scene, dict, rotationX = 0, rotationY = 0, rotationZ = 0) {
        super(scene, scene, dict, rotationX, rotationY, rotationZ);
        // this.button.geometry.rotateY(Math.PI * 0.25);
        // this.button.geometry.getAttribute('position').needsUpdate = true;
        // this.button.position.set(0, params.textY, 0); // Adjust position in the scene
        this.waiting = null;
    }
}    
//     async createText() {
//         this.loadedBoldFont = await this.loadFont(this.fontPathBold);
//         this.start = this.createButtonText(this.dict['start'], this.loadedBoldFont);
//         this.tryAgain = this.createButtonText(this.dict['try_again'], this.loadedBoldFont);
//         this.tryAgain.visible = false;
//         const textGeo = this.createTextGeometry("3", this.loadedBoldFont, textWinner);
//         this.countdownText = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
//         this.countdownText.position.set(0, params.textY, 0);
//         this.countdownText.visible = false;
//         const waitingGeo = this.createTextGeometry("Waiting for enemy ...", this.loadedBoldFont, textWinner);
//         this.waiting = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
//         this.waiting.position.set(0, params.textY, 1.5);
//         this.waiting.visible = false;
//         this.winnerMessage = this.createWinnerMessage("winner", this.loadedBoldFont)
//         this.winnerMessage.visible = false;
//         this.group.add(this.start, this.tryAgain, this.waiting, this.countdownText, this.winnerMessage);

//     }
    // async createWaitingMsg() {
    //     const textGeo = this.createTextGeometry("Waiting for enemy ...", this.loadedBoldFont, textWinner);
    //     const textMat = new THREE.MeshNormalMaterial();
    //     const textMesh = new THREE.Mesh(textGeo, textMat);
    //     textMesh.position.set(0, params.textY, 1.5); // Center the text
    //     // textMesh.visible = false;
    //     this.waiting = textMesh;
    //     return textMesh;
    // }

    // createWinnerMessage(msg) {
    //     const textGeo = this.createTextGeometry(msg, this.loadedBoldFont, textWinner);
    //     textGeo.rotateY(Math.PI * 0.5);
    //     const textMat = new THREE.MeshNormalMaterial();
    //     const textMesh = new THREE.Mesh(textGeo, textMat);
    //     textMesh.position.set(0, params.textY + 5, 1.5); // Center the text
    //     this.winnerMessage = textMesh;
    //     this.scene.add(textMesh);  
    // }

// }