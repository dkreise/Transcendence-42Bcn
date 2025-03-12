// const waitingUntilTournamentStarts = (tournamentId) => {
//     const startButton = document.getElementById('start-tournament-button');
//     const homeButton = document.getElementById('home-button');
    
//     // const intervalId = setInterval(() => {
//         makeAuthenticatedRequest(`${baseUrl}:8001/api/get-players-count/${tournamentId}`, 
//             {method: "GET", credentials: "include"})
//         .then(response => response.json())
//         .then(data => {

//             if (data.players_count !== undefined) {
             
//                 const playerCountElement = document.querySelector('.tournament-value.d-inline');
//                 const currentPlayerCount = parseInt(playerCountElement.textContent);

//                 if (data.players_count !== currentPlayerCount) {
//                     playerCountElement.textContent = data.players_count;
//                     //loadWaitingRoomPage(tournamentId);
//                 }

//                 if (data.players_count >= 4) {
//                     clearInterval(intervalId);
//                     loadBracketTournamentPage(tournamentId);
//                 }
//             }
//         })
//         .catch(error => {
//             console.error('Error checking player count', error);
//         });
//     // }, 10000);

//     startButton.addEventListener('click', () => {
//         // clearInterval(intervalId);
//         //navigateTo('/tournament-bracket', true);
//         loadBracketTournamentPage(tournamentId);
//     });

//     homeButton.addEventListener('click', () => {
//         // clearInterval(intervalId);
//         loadHomePage('/home');
//     });

// };


export const loadJoinTournamentPage = () => {
    //     makeAuthenticatedRequest(baseUrl + ":8001/api/join-tournament-page/", 
    //         {method: "GET", credentials: "include"})
    //     .then((response) => response.json())
    //     .then(data => {
    //         if (data.join_tournament_html) {
    //             document.getElementById('content-area').innerHTML = data.join_tournament_html;
    //         } else {
    //             console.error('Join tournament page HTML not found in response:', data);
    //         }
    //     })
    //     .catch(error => {
    //         console.error('Error loading page', error);
    //     });
    // };
    


// export const loadWaitingRoomPage = (tournamentId) => {
//     makeAuthenticatedRequest(`${baseUrl}:8001/api/waiting-room-page/${tournamentId}`, 
//         {method: "GET", 
//         credentials: "include"})
//     .then((response) => response.json())
//     .then(data => {
//         if (data.waiting_room_html) {
//             document.getElementById('content-area').innerHTML = data.waiting_room_html;
//             waitingUntilTournamentStarts(data.tournament_id);
//         } else {
//             console.error('Waiting room page HTML not found in response:', data);
//         }
//     })
//     .catch(error => {
//         console.error('Error loading page', error);
//     });
};