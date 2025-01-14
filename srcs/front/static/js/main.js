import { loadLoginPage, handleSignup } from "./login.js";
import { loadProfilePage } from "./profile.js";
import { handleLoginIntra, handle42Callback } from "./42auth.js";
import { loadHomePage } from "./home.js";

const historyTracker = [];

const routes = {
    '/': homePage,
    '/login': homePage,
    // '/login': (args) => loadLoginPage(args),
    '/signup': handleSignup,
    '/login-intra': handleLoginIntra, 
    '/callback': handle42Callback,
    '/profile': loadProfilePage,
    // '/logout':  
    // '/options': optionsPage,
    // '/localgame': localGamePage,
    // '/aigame': aiGamePage,
    // '/tournament': tournamentPage
};

function router() {
    const path = window.location.pathname;

    if (routes[path]) {
        routes[path](); // Call the function associated with the path
    } else {
        console.log(`Route ${path} not handled`);
        // renderNotFound(); // Handle unknown routes
    }
}

export function navigateTo(path, replace = false) {
    console.log(`navigating to ${path}`)
    if (replace) {
        history.replaceState({ path }, null, path);
        historyTracker.push({ action: 'replaceState', path });
        console.log(`${path} is replaced in history`)
    }
    else {
        history.pushState({ path }, null, path);
        historyTracker.push({ action: 'pushState', path });
        console.log(`${path} is pushed to history`)
    }
    console.log('History Tracker:', JSON.stringify(historyTracker, null, 2)); // Log the history
    router();
}

export function clearURL() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
}

function homePage() {
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        console.log('we have access token');
        loadHomePage();
        // navigateTo('/profile');
        // loadProfilePage();
    }
    else {
        console.log('we do not have access token..');
        loadLoginPage(contentArea);
    }
}


var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");

    window.addEventListener('popstate', router);

   
    // Event delegation for data-route attributes
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // Check if the clicked element has the 'data-route' attribute
        if (target && target.hasAttribute('data-route')) {
            const route = target.getAttribute('data-route');
            console.log(`a data rout clicked... ${route}`)
            navigateTo(route);
        }
    });

    console.log(history.state)
    router();
  
});
