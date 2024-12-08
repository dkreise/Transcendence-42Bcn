var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");
    const loginButton = document.getElementById('login-button');
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');
    console.log("Access token:", accessToken);
    // const signin = document.getElementById('signin');
    // const signin_link = document.getElementById('sign-in-link');

    function refreshAccessToken(){
        console.log("holaaaaaaaa");
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

    const loadUserInfo = () => {
        //makeAuthenticatedRequest(baseUrl + ":8000/api/user-info/", {method: "GET"})
        makeAuthenticatedRequest(baseUrl + ":8000/api/profile-page/", {method: "GET"})
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failed to load user info");
            }
        })
        .then((data) => {
            // if (data && data.user_html) {
            //     loginButton.remove();
            //     contentArea.innerHTML = data.user_html;
            //     addLogoutListener();
            // }
            if (data && data.profile_html) {
                loginButton.remove();
                contentArea.innerHTML = data.profile_html;
                addLogoutListener();
            }
        })
        .catch((error) => console.error("Error loading user info:", error));
    };

    if (accessToken) {
        console.log('we have access token');
        loadUserInfo();
    }
    else {
        console.log('we do not have access token..');
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
                                    displayLoginError('Invalid credentials. Please try again.', 'login-form');
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

    contentArea.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'sign-in-link') {
            event.preventDefault();
            console.log('Sign In button clicked!');
            const signin = document.getElementById('signin');
            const loginForm = document.getElementById('login-form');
            if (signin)
                signin.remove();
            if (loginForm)
                loginForm.remove();
            fetch('SignInForm.html')
                .then(response => response.text())
                .then(html => {
                    contentArea.innerHTML = html;
                    const signupForm = document.getElementById('signup-form');
                    if (signupForm) {
                        signupForm.addEventListener('submit', (event) => {
                            event.preventDefault();
                            console.log('Submit of sign up clicked!');
                            const formData = new FormData(signupForm);
                            fetch(signupForm.action, {
                                method: 'POST',
                                body: JSON.stringify(Object.fromEntries(formData)),
                                headers: {'Content-Type': 'application/json'}
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    localStorage.setItem('access_token', data.tokens.access);
                                    localStorage.setItem('refresh_token', data.tokens.refresh);
                                    loadUserInfo();
                                } else {
                                    displayLoginError(data.error + ' Please try again.', 'signup-form');
                                }
                            })
                        })
                    }
                })
                .catch(error => console.error('Error loading Sign In form:', error));
        }
    });  

    const displayLoginError = (message, form) => {
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
        
        // const loginForm = document.getElementById('login-form');
        const loginForm = document.getElementById(form);
        if (loginForm) {
            loginForm.reset();  // to clear the form
        }
    };

    // const displaySignUpError = (message) => {
    //     const 
    // }

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
