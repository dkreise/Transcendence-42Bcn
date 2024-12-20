import { makeAuthenticatedRequest } from "./login.js";

var baseUrl = "http://localhost"; // change (parse) later

// some functions are repeated for now from main.js..
// const makeAuthenticatedRequest = (url, options = {}) => {
//     const accessToken = localStorage.getItem("access_token");
//     if (!accessToken) {
//         console.error("No access token available.");
//         return Promise.reject("No access token.");
//     }

//     options.headers = {
//         ...options.headers,
//         Authorization: `Bearer ${accessToken}`, // adding authorization header with the access token
//     };

//     return fetch(url, options).then((response) => {
//         if (response.status === 401) {
//             console.log("Access token expired, attempting refresh..");
//             return refreshAccessToken().then((newAccessToken) => {
//                 options.headers["Authorization"] = `Bearer ${newAccessToken}`;
//                 return fetch(url, options); //retry the original request
//             });
//         } else {
//             return response; // means that response is valid
//         }
//     });
// };

const displayUpdatingError = (message, form) => {
    const profileSettingsContainer = document.getElementById('profile-settings-form');
    if (!profileSettingsContainer)
        return;

    const existingError = document.getElementById('settings-update-error');
    if (existingError)
        existingError.remove();

    const errorMessage = document.createElement('div');
    errorMessage.id = 'settings-update-error';
    errorMessage.style.color = 'red';
    errorMessage.style.marginBottom = '15px';
    errorMessage.textContent = message;

    profileSettingsContainer.prepend(errorMessage); //adding at the top of the login container
};

const renderStatisticsGraph = () => {
    const statsData = {
        gamesPlayed: parseInt(document.getElementById('games-played').innerText) || 0,
        gamesWon: parseInt(document.getElementById('games-won').innerText) || 0,
        tournamentsPlayed: parseInt(document.getElementById('tournaments-played').innerText) || 0,
        tournamentsScore: parseInt(document.getElementById('tournaments-won').innerText) || 0,
    };

    let graphContainer = document.createElement('canvas');
    graphContainer.id = 'stats-chart';
    graphContainer.style.maxWidth = '600px';
    document.querySelector('.statistics-block').appendChild(graphContainer);

    const ctx = document.getElementById('stats-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Games Played', 'Games Won', 'Tournaments Played', 'Avg Tournament Score'],
            datasets: [{
                label: 'Statistics',
                data: [
                    statsData.gamesPlayed,
                    statsData.gamesWon,
                    statsData.tournamentsPlayed,
                    statsData.tournamentsScore,
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                ],
                borderWidth: 1,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

const loadProfileSettingsPage = () => {
    makeAuthenticatedRequest(baseUrl + ":8000/api/profile-settings-page/", {method: "GET"})
        .then(response => response.json())
        .then(data => {
            if (data.profile_settings_html) {
                document.getElementById('content-area').innerHTML = data.profile_settings_html;
            } else {
                console.error('Error fetching settings:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching settings:', error);
        });
};

export const loadProfilePage = () => {
    console.log('Loading profile page..');
    makeAuthenticatedRequest(baseUrl + ":8000/api/profile-page/", {method: "GET"})
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failed to load user info");
            }
        })
        .then((data) => {
            if (data && data.profile_html) {
                document.getElementById('content-area').innerHTML = data.profile_html;
                addLogoutListener();
                console.log('Profile page loaded');
                renderStatisticsGraph();
                console.log('Statistics graph rendered');
            }
        })
        .catch((error) => console.error("Error loading user info:", error));
}

document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");
    contentArea.addEventListener("click", (event) => {
        if (event.target.id == "save-settings-button") {
            event.preventDefault();
            const form = document.querySelector("#profile-settings-container form");
            updateProfileSettings(form);
        }
    });
});

const updateProfileSettings = (form) => {
    const formData = new FormData(form);

    makeAuthenticatedRequest(baseUrl + ":8000/api/update-profile-settings/", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("settings updated successfully!");
                loadProfileSettingsPage();
            } else {
                displayUpdatingError(data.error + ' Please try again.', form);
            }
        })
        .catch((error) => {
            console.log("Error updating settings: ", error);
        });
};

const handleLogout = () => {
    console.log('Logging out..');

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // there can be fetch to back if need to inform backend that user is logging out (optional)

    document.getElementById('content-area').innerHTML = ''; // to clear user content
    const loginButton = document.createElement('button');
    loginButton.id = 'login-button';
    loginButton.textContent = 'LOGIN';
    loginButton.onclick = () => location.reload(); //reload the page to show the button
    document.getElementById('content-area').appendChild(loginButton);
};

const addLogoutListener = () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
};

// document.addEventListener("DOMContentLoaded", () => {
//     loadProfilePage();
//     console.log('Profile page loaded');
//     renderStatisticsGraph();
// });

