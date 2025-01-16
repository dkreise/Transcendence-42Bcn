import { makeAuthenticatedRequest } from "./login.js";
import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"

export const playLocal = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '';
        const heading = document.createElement('h2');
        heading.textContent = 'Here will be the game board'
        contentArea.appendChild(heading);
        console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() // to POST the results
} 

export const playAI = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '';
        const heading = document.createElement('h2');
        heading.textContent = 'Here will be the game board'
        contentArea.appendChild(heading);
        console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() // to POST the results
} 

export const playOnline = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '';
        const heading = document.createElement('h2');
        heading.textContent = 'Here will be the game board'
        contentArea.appendChild(heading);
        console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() // to POST the results
} 
