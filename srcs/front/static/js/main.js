import { loadLoginPage, handleLogin, handleSignup } from "./login.js";
import { loadProfilePage, loadProfileSettingsPage, loadMatchHistoryPage } from "./profile.js";
import { handleLoginIntra, handle42Callback } from "./42auth.js";
import { loadHomePage, setUp3DListener } from "./home.js";
import { loadFriendsSearchPage } from "./friends.js"
import { handleLogout } from "./logout.js"
import { loadLogin2FAPage, enable2FA, disable2FA } from "./twoFA.js";
import { clearIntervalIDGame, cleanupAI } from "./AIGame.js"
import { playLocal, playAI, gameAI, playOnline, play3D, gameLocal } from "./game.js"
import { cleanup3D } from "./3DLocalGame.js";
import { tournamentConnect, manageTournamentHomeBtn, loadTournamentHomePage, createTournament, joinTournament, loadWaitingRoomPage, loadBracketTournamentPage, loadFinalTournamentPage, quitTournament, tournamentGameAIRequest} from "./tournament.js";
import { cleanupLocal } from "./localGame.js"
import { connectWS } from "./onlineStatus.js";

const historyTracker = [];

// The routes object maps URL paths to their respective handler functions:
// Each key is a path (e.g., /, /profile).
// Each value is a function that handles what should happen when the app navigates to that path.

const routes = {
    '/': homePage,
    '/login': loadLoginPage,
    '/handle-login': handleLogin,
    '/signup': handleSignup,
    '/login-intra': handleLoginIntra, 
    '/callback': handle42Callback,
    '/two-fa-login': loadLogin2FAPage,
    '/home': loadHomePage,
    '/profile': loadProfilePage,
    '/profile-settings': loadProfileSettingsPage,
    '/two-fa-setup': enable2FA,
    '/two-fa-disable': disable2FA,
    '/friends': loadFriendsSearchPage,
    '/match-history': loadMatchHistoryPage,
    '/logout': handleLogout,
    '/settings': loadProfileSettingsPage,
    '/play-local': playLocal,
    '/play-ai': (args) => playAI(args),
    '/play-online': playOnline,
    '/game-local': gameLocal,
    // '/tournament': playTournament,
    // '/play-ai/set-difficulty/': setDifficulty,
    '/play-3d': play3D,
    '/play-ai-game': (args) => gameAI(args),
    // '/game-ai': (args) => gameAI(args),
    '/tournament': manageTournamentHomeBtn,
    '/tournament-home': loadTournamentHomePage,
    '/waiting-room': loadWaitingRoomPage,
    '/tournament-bracket': loadBracketTournamentPage,
    '/create-tournament': createTournament,
    '/join-tournament': joinTournament,
    '/end-tournament': loadFinalTournamentPage,
    '/quit-tournament': quitTournament,
    '/tournament-game-ai': tournamentGameAIRequest,
    
    // EXAMPLE how to announce a function that receives parameters:
    // '/login': (args) => loadLoginPage(args),
};

var baseUrl = "http://localhost"; // change (parse) later

// --- headerType = 1 --> draw mainHeader
// --- headerType = 2 --> only lenguaje button
// --- headerType = 3 --> clear Header

export function drawHeader(headerType) {
    return new Promise((resolve, reject) => {
        let url;

        switch (headerType) {
            case 1:
                url = ":8000/api/get-main-header/";
                break;
            
            case 2:
                url = ":8000/api/get-languages-header/";
                break;

            default:
                // borrar header!!!!!!! para el roberto de tomorrow
                resolve();  // IMPORTANTE: Se debe resolver la promesa en el caso por defecto
                return;
        }

        fetch(baseUrl + url, {
            method: 'GET',
            credentials: "include"
        })
        .then((response) => response.json())
        .then(data => {
            if (data.header_html) {
                console.log('Header! returned!');
                document.getElementById('header-area').innerHTML = data.header_html;
                document.dispatchEvent(new CustomEvent("headerLoaded"));
                console.log('header event active');
            } else
                console.error('Header not found in response:', data);
            resolve();
        })
        .catch(error => {
            console.error('Error loading Header =(', error);
            reject(error);
        });
    });
}

export function cleanupGames() {
    cleanup3D();
    cleanupLocal();
    cleanupAI();
}

// The router() function determines which handler function to call 
// based on the current path (window.location.pathname).
// If the path exists in the routes object, its associated function is executed.

function router(args=null) {
    
    cleanupGames();
    let path = window.location.pathname;
    console.log(path);
// const contentArea = document.getElementById('content-area');
// contentArea.innerHTML = ''; // Clear previous content

    console.log(`Content cleared in router`);

    //Check if the user has the required permissions, if not, redirect
    const publicPaths = ['/login', '/signup', '/login-intra', '/callback', '/two-fa-login'];
    if (checkPermission() && publicPaths.includes(path)) {
        navigateTo('/home');
        return;
    } else if (!checkPermission() && !publicPaths.includes(path)) {
        navigateTo('/login');
        return;
    }
    
    if (routes[path]) {
        routes[path](args); // Call the function associated with the path
    } else {
        alert("path doesn't exists");
        console.log(`Route ${path} not handled`);
        // showNotFound(); // Handle unknown routes
    }
}

// function showNotFound() {
//     console.log("Rendering 404 Page");
//     contentArea.innerHTML = `
//         <div>
//             <h1>404 - Page Not Found</h1>
//             <p>The requested page does not exist.</p>
//         </div>
//     `;
// }

// The navigateTo() function is responsible for programmatically changing 
// the browser's history and triggering the router.
// history.pushState(): Adds a new entry to the browser's history stack and 
// changes the URL in the address bar.
// history.replaceState(): Updates the current history entry instead of 
// creating a new one.
// After modifying the browser's history, router() is called to render the appropriate page.
// Additionally, a historyTracker array is maintained for debugging, which logs every navigation event 
// (pushState or replaceState).

export function navigateTo(path, replace = false, args = null) {
    console.log(`navigating to ${path} with args: `, args)

    // // Extract query params
    // const [cleanPath, queryString] = path.split("?");
    // const args = Object.fromEntries(new URLSearchParams(queryString));

    if (replace) { //DONT ADD TO HISTORY
        history.replaceState({ path, args }, null, path);
        historyTracker.push({ action: 'replaceState', path });
        console.log(`${path} is replaced in history`)
    }
    else { //ADD TO HISTORY

        history.pushState({ path, args }, null, path);
        historyTracker.push({ action: 'pushState', path });
        console.log(`${path} is pushed to history`)
    }
    //console.log('History Tracker:', JSON.stringify(historyTracker, null, 2)); // Log the history
    router(args);
}

// The clearURL() function removes query parameters from the URL 
// without reloading the page.
// Useful for cleaning up callback URLs (e.g., after OAuth authentication).

export function clearURL() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
}

export function checkPermission () {
    //console.log(`Permissions: checking permissions`);
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
        //console.log(`Permissions: No access token, permission denied`);
        return false;
    }
    //console.log(`Permissions: We have access token, congrats!`);
    return true;
}

function homePage() {
    // const contentArea = document.getElementById('content-area');
    
    if (checkPermission ()) {
        navigateTo('/home');
    }
    else {
        // console.log('we do not have access token..');
        navigateTo('/login');
    }
}

// popstate: Ensures navigation works when the user uses the browser's 
// back or forward buttons.
// data-route Click Handling: Intercepts clicks on elements with the 
// data-route attribute and calls navigateTo() with the target route.

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");

    window.addEventListener('popstate', (event) => {
        console.log("Popstate triggered:", event);
        cleanup3D();       // Always clean up before routing
        clearIntervalIDGame();
        router();          // Then handle the new route
    });

    let shouldRoute = true;
    const tourId = localStorage.getItem("currentTournamentId");
    const tourReload = localStorage.getItem("tournamentReload");
    if (tourId && tourReload) {
        shouldRoute = false;
        console.log("Reconnecting WebSocket after page reload...");
        localStorage.removeItem("tournamentReload");
        // tournamentConnect(tourId);
        tournamentConnect(tourId).then(() => {
            console.log("WebSocket connection established, now navigating to ...");
            // navigateTo('/waiting-room');
            router();
        }).catch((error) => {
            console.error("Error connecting WebSocket:", error);
            // Handle error, possibly redirect to another page or show an alert
        });
    }
    
    window.addEventListener("load", connectWS(localStorage.getItem('access_token')));
   
    // Event delegation for data-route attributes
    document.body.addEventListener('click', (event) => {

        const target = event.target.closest('[data-route]');

        if (target) {
            const route = target.getAttribute('data-route');
            console.log(`Data-route clicked: ${route}`);

            event.preventDefault();

            const shouldReplace = target.hasAttribute('replace-url');

            // Extract arguments from `data-args` (if present)
            const args = target.hasAttribute("data-args")
                ? JSON.parse(target.getAttribute("data-args"))
                : null;
            console.log("Extracted args:", args);

            navigateTo(route, shouldReplace, args);
        }
    });
    
    if (shouldRoute) {
        console.log(history.state)
        cleanup3D();
        router();        
    }
});
