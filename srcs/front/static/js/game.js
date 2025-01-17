import { makeAuthenticatedRequest } from "./login.js";
import { addLogoutListener } from "./logout.js";
import { navigateTo, checkPermission } from "./main.js"

var baseUrl = "http://localhost"; // change (parse) later

export const playLocal = () => {

    if (!checkPermission) {
        navigateTo('/login');
    } else {

        console.log('Loading get second name page...')
        makeAuthenticatedRequest(baseUrl + ":8001/api/game/local-game/get-name/", {method: "GET"})
            .then(respose => respose.json())
            .then(data => {
                if (data.get_second_name_html) {
                    document.getElementById('content-area').innerHTML = data.get_second_name_html;
                } else {
                    console.error('Error fetching second player page:', data.error);
                }
            })
            .catch(error => {
                console.error('Error fetching second player page:', error);
            });

        // const contentArea = document.getElementById('content-area');
        // contentArea.innerHTML = '';
        // const heading = document.createElement('h2');
        // heading.textContent = 'Here will be the game board'
        // contentArea.appendChild(heading);
        // console.log(`Here will be the game board`);
    }
    // makeAuthenticatedRequest() //.py to POST the results
} 

export const gameLocal = () => {

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
    // makeAuthenticatedRequest() //.py to POST the results
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
