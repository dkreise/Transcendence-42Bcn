import { handleLogout } from "./logout.js"
import { navigateTo, drawHeader } from "./main.js";
import { updateLanguage } from "./langs.js";
import { connectWS } from "./onlineStatus.js";

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const userMgmtPort = window.env.USER_MGMT_PORT;

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        console.error("No refresh token found. User needs to log in again.");
        handleLogout();
        return Promise.reject("No refresh token available");
    }

    return fetch(baseUrl + userMgmtPort + "/api/token/refresh/", {
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
            if (data.refresh) {
                console.log("new refresh!!!!");
                localStorage.setItem("refresh_token", data.refresh);
            }
            return data.access;
        }
    })
    .catch((error) => {
        console.log("Error during token refresh:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        throw error;
    });
};

export const makeAuthenticatedRequest = (url, options = {}) => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No access token available.");
        // return Promise.reject("No access token.");
        navigateTo('/login', true); // + maybe remove everything from local storage? or just handleLogout?
    }
    console.log(url);
    options = {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": `Bearer ${accessToken}`, // adding authorization header with the access token
            // "Content-Type": "application/json",
        },
        credentials: "include",
    };

    return fetch(url, options).then((response) => {
        if (response.status === 401) {
            console.log("Access token expired, attempting refresh..");
            return refreshAccessToken().then((newAccessToken) => {
                options.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return fetch(url, options); //retry the original request
            });
        } else {
            console.log(url);
            return response; // means that response is valid
        }
    });
};

export const loadLoginPage = () => {
    drawHeader('login').then(() => {
        return fetch(baseUrl + userMgmtPort + "/api/login-form/", {
            method: 'GET',
            credentials: "include"
        });
    })
    .then((response) => response.json())
    .then(data => {
        if (data.form_html) {
            console.log('Form html returned!');
            document.getElementById('content-area').innerHTML = data.form_html;
        } else {
            console.error('Form HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const handleLogin = async () => {
    const loginForm = document.getElementById('login-form');
    const formData = new FormData(loginForm);
    const dataToSend = JSON.stringify(Object.fromEntries(formData));
    try {
        const response = await fetch(baseUrl + userMgmtPort + "/api/login/", {
            method: 'POST',
            body: dataToSend,
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            if (data.two_fa_required) {
                localStorage.setItem('temp_token', data.temp_token);
                navigateTo('/two-fa-login', true);
            } else {
                localStorage.setItem('access_token', data.tokens.access);
                localStorage.setItem('refresh_token', data.tokens.refresh);
                await updateLanguage(); 
                connectWS(data.tokens.access);
                navigateTo('/home', true);
            }
        } else {
            displayLoginError('login-form', 'Invalid Credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
};

export const loadSignupPage = () => {
    drawHeader('login').then(() => {
        return fetch(baseUrl + userMgmtPort + "/api/signup-form/", {
            method: 'GET',
            credentials: "include"
        });
    })
    .then((response) => response.json())
    .then(data => {
        if (data.form_html) {
            console.log('Form html returned!');
            document.getElementById('content-area').innerHTML = data.form_html;
        } else {
            console.error('Form HTML not found in response:', data);
        }
    })
    .catch(error => {
        console.error('Error loading page', error);
    });
};

export const handleSignup = async () => {
    const signupForm = document.getElementById('signup-form');
    const formData = new FormData(signupForm);

    fetch(baseUrl + userMgmtPort + "/api/register/", {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(async (signupData) => {
        if (signupData.success) {
            localStorage.setItem('access_token', signupData.tokens.access);
            localStorage.setItem('refresh_token', signupData.tokens.refresh);
            let lang = getCookie("language") || "en";
            await updateLanguage(lang);
            connectWS(signupData.tokens.access);
            navigateTo('/home', true);
        } else {
            displayLoginError('signup-form', `${signupData.error}`);
        }
    })
    .catch(error => {
        console.error('Error submitting signup form:', error);
    });
};

export const displayLoginError = (form, errorMessage) => {
    const login_error = document.getElementById('login-error');
    if (!login_error)
        return;

    login_error.innerText = errorMessage;

    login_error.classList.add('show');
    setTimeout(() => {
        login_error.classList.remove('show');
      }, 2500);
    // loginContainer.prepend(errorMessage); //adding at the top of the login container
    
    const loginForm = document.getElementById(form);
    if (loginForm) {
        loginForm.reset();  // to clear the form
    }
};

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

