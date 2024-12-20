// Define constants
const baseUrl = "http://localhost";

console.log('main.js is loaded');

const accessToken = localStorage.getItem('access_token');
console.log("Access token:", accessToken);

if (accessToken) {
    console.log('Access token found');
    loadUserInfo();
} else {
    console.log('No access token found');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");

    const loginButton = document.getElementById('login-button');
    const contentArea = document.getElementById('content-area');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked!');
            loginButton.remove();
            
            fetch('html/login_form.html')
                .then(response => response.text())
                .then(data => {
                    console.log('Form HTML loaded!');
                    contentArea.innerHTML = data;
                })
                .catch(error => console.error('Error loading login form:', error));
        });
    } else {
        console.error('Login button not found in the DOM!');
    }

    contentArea.addEventListener('click', handleSignupLinkClick);
});


async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        console.error("No refresh token found. User needs to log in again.");
        return Promise.reject("No refresh token available");
    }

    try {
        const response = await fetch(`${baseUrl}:8000/login/api/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            console.error("Refresh token invalid or expired.");
            handleLogout();
            throw new Error("Refresh token invalid or expired.");
        }

        const data = await response.json();
        if (data.access) {
            localStorage.setItem("access_token", data.access);
            return data.access;
        }
    } catch (error) {
        console.error("Error refreshing access token:", error);
    }
}


async function makeAuthenticatedRequest(url, options = {}) {
    let token = localStorage.getItem("access_token");
    if (!token) {
        console.error("No access token available.");
        return Promise.reject("No access token.");
    }

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    try {
        let response = await fetch(url, options);

        if (response.status === 401) {
            console.log("Access token expired, attempting refresh...");
            const newToken = await refreshAccessToken();
            options.headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(url, options);
        }

        return response;
    } catch (error) {
        console.error("Error making authenticated request:", error);
        throw error;
    }
}


async function loadUserInfo() {
    try {
        const response = await makeAuthenticatedRequest(`${baseUrl}:8000/profile/api/profile-page/`, { method: "GET" });
        if (response.ok) {
            const data = await response.json();
            if (data && data.profile_html) {
                updateContentArea(data.profile_html);
                addLogoutListener();
            }
        } else {
            console.error("Failed to load user info");
        }
    } catch (error) {
        console.error("Error loading user info:", error);
    }
}


function loadLoginForm() {
    loginButton.remove();
    console.log('Login button clicked!');
    fetch('html/login_form.html')
        .then(response => response.text())
        .then(html => {
            updateContentArea(html);
            setupLoginForm();
        })
        .catch(error => console.error('Error loading login form:', error));
}


function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Submit button clicked!');

            const formData = new FormData(loginForm);

            try {
                const response = await fetch(loginForm.action, {
                    method: 'POST',
                    body: JSON.stringify(Object.fromEntries(formData)),
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('access_token', data.tokens.access);
                    localStorage.setItem('refresh_token', data.tokens.refresh);
                    loadUserInfo();
                } else {
                    displayError('Invalid credentials. Please try again.', 'login-form');
                }
            } catch (error) {
                console.error('Error logging in:', error);
            }
        });
    }
}


function handleSignupLinkClick(event) {
    if (event.target && event.target.id === 'signup-link') {
        loginButton.remove();
        event.preventDefault();
        console.log('Sign Up button clicked!');

        fetch('html/signup_form.html')
            .then(response => response.text())
            .then(html => {
                updateContentArea(html);
                setupSignupForm();
            })
            .catch(error => console.error('Error loading Sign Up form:', error));
    }
}


function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Submit of sign up clicked!');

            const formData = new FormData(signupForm);

            try {
                const response = await fetch(signupForm.action, {
                    method: 'POST',
                    body: JSON.stringify(Object.fromEntries(formData)),
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('access_token', data.tokens.access);
                    localStorage.setItem('refresh_token', data.tokens.refresh);
                    loadUserInfo();
                } else {
                    displayError(data.error + ' Please try again.', 'signup-form');
                }
            } catch (error) {
                console.error('Error signing up:', error);
            }
        });
    }
}


function displayError(message, formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const existingError = document.getElementById('form-error');
    if (existingError) existingError.remove();

    const errorMessage = document.createElement('div');
    errorMessage.id = 'form-error';
    errorMessage.style.color = 'red';
    errorMessage.textContent = message;
    form.prepend(errorMessage);
    form.reset();
}


function handleLogout() {
    console.log('Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    updateContentArea('');
    location.reload();
}


function addLogoutListener() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

function updateContentArea(html) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = html;
}