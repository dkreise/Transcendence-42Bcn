import { makeAuthenticatedRequest } from "./login.js";

var baseUrl = "http://localhost"; // change (parse) later

export const loadFriendsSearchPage = () => {
    makeAuthenticatedRequest(baseUrl + ":8000/api/search-users", {method: "GET", credentials: "include"})
        .then((response) => response.json())
        .then(data => {
            if (data.search_users_html) {
                document.getElementById('content-area').innerHTML = data.search_users_html;
            } else {
                console.error('Error fetching friends search:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching friends search:', error);
        });
};

const performSearch = () => {
    const searchInput = document.getElementById("search-input");
    const query = searchInput.value.trim();
    console.log('query:', query);

    if (query) {
        makeAuthenticatedRequest(baseUrl + ":8000/api/search-users/?q=" + encodeURIComponent(query), {method: "GET"})
            .then((response) => response.json())
            .then(data => {
                if (data.search_users_html) {
                    document.getElementById('content-area').innerHTML = data.search_users_html;
                } else {
                    console.error('Error fetching friends search:', data.error);
                }
            })
            .catch(error => {
                console.error('Error fetching friends search:', error);
            });
    }
};

const addFriend = (friendId) => {
    makeAuthenticatedRequest(baseUrl + `:8000/api/add-friend/${friendId}/`, {method: "POST"})
        .then((response) => response.json())
        .then(data => {
            if (data.status == "success") {
                console.log('friend added!!');

                const button = document.querySelector(`#add-friend-button[data-id="${friendId}"]`);
                if (button) {
                    button.textContent = 'Remove Friend';
                    button.id = 'remove-friend-button';
                    button.classList.remove('btn-success');
                    button.classList.add('btn-danger');
                }

                const friendsSection = document.querySelector("#friends-section");
                let friendsList = friendsSection.querySelector("ul");
                if (!friendsList) {
                    friendsList = document.createElement("ul");
                    friendsSection.appendChild(friendsList);
                    const noFriendsMessage = friendsSection.querySelector("p");
                    if (noFriendsMessage) {
                        noFriendsMessage.remove();
                    }
                }
                
                const newFriendItem = document.createElement("li");
                newFriendItem.id = "friend-item";
                newFriendItem.setAttribute("data-id", friendId);
                
                newFriendItem.innerHTML = `
                    <img src="${ data.friend.photo_url }" alt="Profile Photo" class="friend-photo">
                    <div class="user-info">
                        ${data.friend.username}
                        ${data.friend.email ? `(${data.friend.email})` : ""}
                    </div>
                    <span class="d-flex align-items-center ms-3 me-3">
                        <span class="status-dot me-1 ${data.friend.online_status ? 'status-online' : 'status-offline'}"></span>
                        <span>${data.friend.online_status ? 'Online' : 'Offline'}</span>
                    </span>
                `;
                friendsSection.appendChild(newFriendItem);
            } else {
                console.log('error while adding friend :(');
            }
        })
        .catch(error => {
            console.error('Error adding friend:', error.message || error);
        });
};

const removeFriend = (friendId) => {
    makeAuthenticatedRequest(baseUrl + `:8000/api/remove-friend/${friendId}/`, {method: "POST"})
        .then((response) => response.json())
        .then(data => {
            if (data.status == "success") {
                console.log('friend removed!!');

                const button = document.querySelector(`#remove-friend-button[data-id="${friendId}"]`);
                if (button) {
                    button.textContent = 'Add Friend';
                    button.id = 'add-friend-button';
                    button.classList.remove('btn-danger');
                    button.classList.add('btn-success');
                }

                const friendItem = document.querySelector(`#friend-item[data-id="${friendId}"]`);
                if (friendItem) {
                    friendItem.remove();
                }
            } else {
                console.log('error while removing friend :(' + data.message);
            }
        })
        .catch(error => {
            console.error('Error removing friend:', error.message || error);
        });
};

document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");
    contentArea.addEventListener("click", (event) => {
        // if (event.target && event.target.id == "friends-button") {
        //     loadFriendsSearchPage();
        // }
        if (event.target && event.target.id == "submit-search") {
            event.preventDefault();
            performSearch();
        }
        if (event.target && event.target.id == "add-friend-button") {
            addFriend(event.target.getAttribute('data-id'));
        }
        if (event.target && event.target.id == "remove-friend-button") {
            removeFriend(event.target.getAttribute('data-id'));
        }
        // if (event.target && event.target.id == "back-to-profile-button") {
        //     loadProfilePage();
        // }
    });
});