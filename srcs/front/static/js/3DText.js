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

    constructor(scene) {
        this.scene = scene;
        this.loader = new FontLoader();
        this.fontPathRegular = "../three/examples/fonts/helvetiker_regular.typeface.json";
        this.fontPathBold = "../three/examples/fonts/helvetiker_regular.typeface.json";
        this.loadedBoldFont = null;
        this.button = this.createButton();
        this.start = null;
        this.tryAgain = null;
        this.winnerMessage = null;
        this.countdownText = null;
        this.createText();
        // this.tryAgain = this.createTryAgain();
        this.winnerMessage = null;
    }

    createButton() {
        const buttonGeo = new RoundedBoxGeometry(15, 5, 3, field.radius, field.seg * 3); // Button size
        const buttonMat = new THREE.MeshPhongMaterial({ 
            color: params.buttonColor,
            specular: 0xFFFFFF, 
            shininess: 100,
            });
        const button = new THREE.Mesh(buttonGeo, buttonMat);
        button.castShadow = true;
        button.receiveShadow = true;
        button.position.set(0, params.textY, 0); // Adjust position in the scene
        this.scene.add(button);
        return button;
    }

    createText() {
        this.loader.load(this.fontPathBold, (font) => {
            this.loadedBoldFont = font; 
            this.start = this.createButtonText("START !", this.loadedBoldFont);
            this.tryAgain = this.createButtonText("TRY AGAIN", this.loadedBoldFont);
            this.tryAgain.visible = false;
            const textGeo = this.createTextGeometry("3", this.loadedBoldFont, textWinner);
            this.countdownText = new THREE.Mesh(textGeo, new THREE.MeshNormalMaterial());
            this.countdownText.position.set(0, params.textY, 0);
            this.countdownText.visible = false;
            this.scene.add(this.start, this.tryAgain, this.countdownText);
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

    createWinnerMessage(msg) {
        const textGeo = this.createTextGeometry(msg, this.loadedBoldFont, textWinner);
        const textMat = new THREE.MeshNormalMaterial();
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(0, params.textY + 5, 1.5); // Center the text
        this.winnerMessage = textMesh;
        this.scene.add(textMesh);  
    }

    updateGeometry(mesh, msg, params) {
        mesh.geometry = this.createTextGeometry(msg, this.loadedBoldFont, params);
        mesh.geometry.getAttribute('position').needsUpdate = true;
        // mesh.winnerMessage.visible = true;
    }
}