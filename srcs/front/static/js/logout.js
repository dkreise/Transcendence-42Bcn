import { loadLoginPage } from "./login.js";
import { navigateTo } from "./main.js";
import { disconnectWS } from "./onlineStatus.js"

var baseUrl = "http://localhost"; // change (parse) later

export const handleLogout = () => {
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

    disconnectWS()
    console.log("WebSocket closed upon logout.");

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('intra_token');
    localStorage.setItem("3D-option", "false")

    //contentArea.innerHTML = ''; // to clear user content
    window.history.replaceState(null, null, '/'); // ????
    navigateTo('/login', true);
};

// ADD DATA-ROUTE INSTEAD
// export const addLogoutListener = () => {
//     const logoutButton = document.getElementById('logout-button');
//     if (logoutButton) {
//         logoutButton.addEventListener('click', handleLogout);
//     }
// };