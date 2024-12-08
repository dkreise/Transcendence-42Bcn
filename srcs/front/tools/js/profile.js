var baseUrl = "http://localhost"; // change (parse) later

const makeAuthenticatedRequest = (url, options = {}) => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No access token available.");
        return Promise.reject("No access token.");
    }

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`, // adding authorization header with the access token
    };

    return fetch(url, options).then((response) => {
        if (response.status === 401) {
            console.log("Access token expired, attempting refresh..");
            return refreshAccessToken().then((newAccessToken) => {
                options.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return fetch(url, options); //retry the original request
            });
        } else {
            return response; // means that response is valid
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
                alert("failed to update settings :( :" + data.error);
            }
        })
        .catch((error) => {
            console.log("Error updating settings: ", error);
        });
};