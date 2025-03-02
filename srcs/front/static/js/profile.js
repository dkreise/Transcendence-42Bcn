import { makeAuthenticatedRequest } from "./login.js";
// import { startGame } from "./remoteGame.js"
// import { animate } from "./threeTest.js"
import { drawHeader } from "./main.js";



var baseUrl = "http://localhost"; // change (parse) later

export const displayUpdatingMessage = (message, color) => {
    const profileSettingsContainer = document.getElementById('profile-settings-form');
    if (!profileSettingsContainer)
        return;

    const existingError = document.getElementById('settings-update-error');
    if (existingError)
        existingError.remove();

    const errorMessage = document.createElement('div');
    errorMessage.id = 'settings-update-error';
    errorMessage.style.color = color;
    errorMessage.style.marginBottom = '15px';
    errorMessage.textContent = message;

    profileSettingsContainer.prepend(errorMessage); //adding at the top of the login container
};

const fetchLastTenGames = () => {
    return makeAuthenticatedRequest(`${baseUrl}:8000/api/last-ten-games/`, {
        method: "GET",
    }).then((response) => response.json());
}

const renderLastTenGamesChart = (gamesData, username) => {
    // let graphContainer = document.createElement('canvas');
    // graphContainer.id = 'last-ten-games-chart';
    // graphContainer.style.maxWidth = '600px';
    // document.querySelector('.statistics-block').appendChild(graphContainer);

    const ctx = document.getElementById('last-ten-games-chart').getContext('2d');

    const gameCnt = parseInt(document.getElementById('games-played').textContent, 10);
    console.log(gameCnt);
    const labels = gamesData.map((_, index) => {
        return `Game ${gameCnt - (gamesData.length - 1 - index)}`;
    });

    const scores = gamesData.map((game) => {
        if (game.player1 === username) {
            return game.score_player1;
        } else if (game.player2 === username) {
            return game.score_player2;
        }
        return 0;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Scores',
                data: scores,
                backgroundColor: "rgba(187, 134, 252, 1)",
                borderColor: "rgba(152, 40, 237, 0.5)",
                borderWidth: 1,
            },]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    // enabled: true,
                    // mode: 'index',
                    callbacks: {
                        label: (tooltipItem) => {
                            const game = gamesData[tooltipItem.dataIndex];
                            const opponent = 
                                game.player1 === username
                                    ? game.player2
                                    : game.player1;
                            const score = 
                                game.player1 === username
                                    ? game.score_player1
                                    : game.score_player2;
                            const winner = game.winner;
                            const tournament =
                                game.tournament_id >= 0
                                    ? 'yes'
                                    : 'no';
                            return `Score: ${score}; Opponent: ${opponent}; Winner: ${winner}; Tournament: ${tournament}`;
                        },
                    },
                    displayColors: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    bodyFont: { size: 14 },
                    titleFont: { size: 16 },
                },
                title: {
                    display: true,
                    text: 'Last 10 Games Performance',
                    font: {
                        size: 18,
                    },
                },
                legend: {
                    display: false,
                },
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const gameIndex = elements[0].index;
                    const game = gamesData[gameIndex];
                    const opponent = 
                        game.player1 === username
                            ? game.player2
                            : game.player1;
                    const score = 
                        game.player1 === username
                            ? game.score_player1
                            : game.score_player2;
                    alert(
                        `Game Details:\nOpponent: ${opponent}\nYour Score: ${score}\nWinner: ${game.winner}`
                    );
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score',
                    }
                },
            },
        },

    });
};

export const loadMatchHistoryPage = () => {
    drawHeader('main').then(() => {
       return makeAuthenticatedRequest(baseUrl + ":8000/api/match-history-page/", {method: "GET"})
            .then(response => response.json())
            .then(data => {
                if (data.match_history_html) {
                    document.getElementById('content-area').innerHTML = data.match_history_html;
                } else {
                    console.error('Error fetching settings:', data.error);
                }
            })
            .catch(error => {
                console.error('Error fetching settings:', error);
            });
        })
}

const applyFilters = () => {
    console.log('applying filters...');
    const dateFilter = document.getElementById('filter-date').value;
    const winnerFilter = document.getElementById('filter-winner').value.toLowerCase();
    const tournamentFilter = document.getElementById('filter-tournament').value.toLowerCase();

    let rows = document.querySelectorAll('#match-history-table-body tr');

    rows.forEach(row => {
        const date = row.children[0].textContent;
        const winner = row.children[5].textContent.toLowerCase();
        const tournament = row.children[6].textContent.toLowerCase();

        let matchesDate = !dateFilter || date.startsWith(dateFilter);
        let matchesWinner = !winnerFilter || winner.includes(winnerFilter);
        let matchesTournament = !tournamentFilter || (tournamentFilter == tournament);

        if (matchesDate && matchesWinner && matchesTournament) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }

    });
}


export const loadProfileSettingsPage = () => {
    console.log("LOADING PROFILE...")
    drawHeader('main').then(() => {
    return  makeAuthenticatedRequest(baseUrl + ":8000/api/profile-settings-page/", {
        method: "GET",
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.profile_settings_html) {
                document.getElementById('content-area').innerHTML = data.profile_settings_html;
                // if (msg) {
                //     displayUpdatingMessage(msg, 'green');
                // }
            } else {
                console.error('Error fetching settings:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching settings:', error);
        });
    })
};

export const loadProfilePage = () => {
    console.log('Loading profile page..');
    drawHeader('main').then(() => {
    return makeAuthenticatedRequest(baseUrl + ":8000/api/profile-page/", {
        method: "GET",
        credentials: 'include'
        })
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failed to load user info");
            }
        })
        .then((data) => {
            console.log("Estamos activoooos");
            if (data && data.profile_html) {
                document.getElementById('content-area').innerHTML = data.profile_html;
                // addLogoutListener();
                console.log('Profile page loaded');
                fetchLastTenGames().then((gamesData) => {
                    if (gamesData) {
                        const { username, games } = gamesData;
                        renderLastTenGamesChart(games, username);
                    }
                });
                console.log('Statistics graph rendered');
            }
        })
        .catch((error) => console.error("Error loading user info:", error));
};


//////////////////// TO DELETE ////////////////////////////////////////
// export const loadGame = (contentArea) => {
//     console.log('Loading game..');
// 	fetch('html/game.html')  // Call the API endpoint to get the form as JSON
//         .then(response => response.text())
//         .then(data => {
//             if (data) {
//                     console.log('Game returned!');
//                     contentArea.innerHTML = data;
// 					const canvas = document.getElementById("gameCanvas");
// 					if (canvas)
// 						animate()
// 					else
// 						console.log("Error: Canvas not found");
						
//             }
//         })
//         .catch(error => console.error('Error loading game:', error));
// };

//////////////////////////////////////////////////////////////


const updateProfileSettings = (form) => {
    const formData = new FormData(form);
    console.log(formData);
    makeAuthenticatedRequest(baseUrl + ":8000/api/update-profile-settings/", {
        method: "POST",
        body: formData,
        credentials: 'include',
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayUpdatingMessage("Settings were updated!", 'green');
            } else {
                displayUpdatingMessage(data.error + ' Please try again.', 'red');
            }
        })
        .catch((error) => {
            console.log("Error updating settings: ", error);
        });
};

document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");
    contentArea.addEventListener("click", (event) => {
        // if (event.target && event.target.id == "profile-settings-button") {
        //     loadProfileSettingsPage();
        // }
        if (event.target && event.target.id == "save-settings-button") {
            event.preventDefault();
            const form = document.querySelector("#profile-settings-container form");
            updateProfileSettings(form);
        }
        // if (event.target && event.target.id == "match-history-button") {
        //     loadMatchHistoryPage();
        // }
        if (event.target && event.target.id == "apply-filters") {
            applyFilters();
        }
        // if (event.target && event.target.id == "back-to-profile-button") {
        //     loadProfilePage();
        // }
        if (event.target && event.target.id == "game") {
            loadGame(contentArea);
        }
    });
});

