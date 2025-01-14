import { loadLoginPage } from "./login.js";

var baseUrl = "http://localhost"; // change (parse) later

const handleLogout = () => {
    const contentArea = document.getElementById("content-area");
    console.log('Logging out..');
    const refreshToken = localStorage.getItem('refresh_token');
    // const accessToken = localStorage.getItem('access_token');

    if (refreshToken) {
        fetch(baseUrl + ":8000/api/logout/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({refresh_token: refreshToken}),
        })
        .then((response) => {
            if (response.ok) {
                console.log('Backend logout successful');
            }
        })
        .catch((error) => {
            console.log('Error logging out: ', error);
        });
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    contentArea.innerHTML = ''; // to clear user content
    loadLoginPage(contentArea);
};

export const addLogoutListener = () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
};