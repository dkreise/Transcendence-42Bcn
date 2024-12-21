import { loadLoginPage } from "./login.js";

const handleLogout = () => {
    const contentArea = document.getElementById("content-area");
    console.log('Logging out..');

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // there can be fetch to back if need to inform backend that user is logging out (optional)

    contentArea.innerHTML = ''; // to clear user content
    loadLoginPage(contentArea);
};

export const addLogoutListener = () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
};