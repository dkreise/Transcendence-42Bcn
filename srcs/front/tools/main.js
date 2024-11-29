var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        loadUserInfo();
    }

    // Function to load the login form dynamically via API
    loginButton.addEventListener('click', () => {
        
        console.log('Login button clicked!');
        loginButton.remove();
        fetch(baseUrl + ':8000/api/login-form/')  // Call the API endpoint to get the form as JSON
            .then(response => response.json())
            .then(data => {
                if (data.form_html) {
                    console.log('Form html returned!');
                    contentArea.innerHTML = data.form_html;  // Insert the form into the content area

                    // Add event listener for form submission
                    const loginForm = document.getElementById('login-form');
                    if (loginForm) {
                        loginForm.addEventListener('submit', (event) => {
                            event.preventDefault();  // Prevent the default form submission
                            console.log('Submit button clicked!');

                            // Send form data via AJAX (????)
                            const formData = new FormData(loginForm);
                            fetch(loginForm.action, {
                                method: 'POST',
                                body: JSON.stringify(Object.fromEntries(formData)),
                                headers: { 'Content-Type': 'application/json' }
                                //body: formData,
                                // headers: {
                                //     'X-CSRFToken': csrfToken || 'hardcoded-token',
                                // },
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    //alert('Login successful!');
                                    localStorage.setItem('access_token', data.tokens.access);
                                    localStorage.setItem('refresh_token', data.tokens.refresh);
                                    loadUserInfo();
                                } else {
                                    //alert('Login failed!');
                                    displayLoginError('Invalid credentials. Please try again.');
                                }
                            })
                            .catch(error => {
                                console.error('Error logging in:', error);
                                alert('An error occurred during login.');
                            });
                        });
                    }
                } else {
                    console.error('Error: No form HTML returned');
                }
            })
            .catch(error => console.error('Error loading login form:', error));
    });

    const refreshAccessToken = () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            console.error("No refresh token found. User needs to log in again.");
            return Promise.reject("No refresh token available");
        }

        return fetch(baseUrl + ":8000/api/token/refresh/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({refresh: refreshToken}),
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Refresh token invalid or expired.");
                handleLogout();
                return Promise.reject("Refresh token invalid or expired.");
            }
        })
        .then((data) => {
            if (data.access) {
                localStorage.setItem("access_token", data.access);
                return data.access;
            }
        });
    };

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

    // const loadUserInfo = () => {
    //     const token = localStorage.getItem('access_token');
    //     if (!token) {
    //         alert('No token found! :(');
    //         return;
    //     }
    
    //     fetch(baseUrl + ':8000/api/user-info/', {
    //         headers: {'Authorization': `Bearer ${token}`}
    //     })
    //     .then(response => response.json())
    //     .then(data => {
    //         if (data.user_html) {
    //             contentArea.innerHTML = data.user_html;
    //             addLogoutListener();
    //         } else {
    //             alert('User not authorized!');
    //         }
    //     })
    //     .catch(error => console.error('Error loading user info:', error));
    // };

    const loadUserInfo = () => {
        makeAuthenticatedRequest(baseUrl + ":8000/api/user-info/", {method: "GET"})
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failed to load user info");
            }
        })
        .then((data) => {
            if (data && data.user_html) {
                loginButton.remove();
                contentArea.innerHTML = data.user_html;
                addLogoutListener();
            }
        })
        .catch((error) => console.error("Error loading user info:", error));
    };

    const displayLoginError = (message) => {
        const loginContainer = document.getElementById('login-container');
        if (!loginContainer)
            return;

        const existingError = document.getElementById('login-error');
        if (existingError)
            existingError.remove();

        const errorMessage = document.createElement('div');
        errorMessage.id = 'login-error';
        errorMessage.style.color = 'red';
        errorMessage.style.marginBottom = '15px';
        errorMessage.textContent = message;

        loginContainer.prepend(errorMessage); //adding at the top of the login container
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();  // to clear the form
        }
    };

    const handleLogout = () => {
        console.log('Logging out..');

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // there can be fetch to back if need to inform backend that user is logging out (optional)

        contentArea.innerHTML = ''; // to clear user content
        const loginButton = document.createElement('button');
        loginButton.id = 'login-button';
        loginButton.textContent = 'LOGIN';
        loginButton.onclick = () => location.reload(); //reload the page to show the button
        contentArea.appendChild(loginButton);
    };

    const addLogoutListener = () => {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    };
});
