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

function loadSettingsPage() {
    makeAuthenticatedRequest(baseUrl + ":8000/api/settings-page/", {method: "GET"})
        .then(response => response.json())
        .then(data => {
            if (data.settings_html) {
                document.getElementById('content-area').innerHTML = data.settings_html;
            } else {
                console.error('Error fetching settings:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching settings:', error);
        });
}