import { loadLoginPage } from "./login.js";
import { loadProfilePage } from "./profile.js";
import { loadHomePage } from "./home.js";

var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        console.log('we have access token');
        loadHomePage();
        // loadProfilePage();
    }
    else {
        console.log('we do not have access token..');
        loadLoginPage(contentArea);
    }

});
