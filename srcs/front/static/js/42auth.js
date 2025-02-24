import { loadProfilePage } from "./profile.js";
import { displayLoginError } from "./login.js";
import { clearURL, navigateTo } from "./main.js";
import { connectWS } from "./onlineStatus.js";
 

var baseUrl = "http://localhost";

export const handleLoginIntra = () => {
    console.log(`login 42 clicked: ${window.location.pathname}`);
    const currentPath = '/';
    window.history.replaceState({ fromOAuth: true, previousPath: currentPath  }, null, '/');
    console.log(history.state)
    window.location.href = "http://localhost:8000/api/login-intra";
}

export const handle42Callback = () => {
    const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const err = urlParams.get('error');
        console.log(`Windows location is ${window.location.href}`)
        window.history.replaceState(null, null, '/');
        if (err) {
            console.log(`error string: ${err}`);
            // alert("Access denied. Try again later");
            clearURL();
            showModalError(`An error occurred: ${err}. Try again later.`);
            navigateTo("/login");
            // displayLoginError('Invalid credentials. Please try again.', 'login-form');
        }
        else if (code && state){
            const queryParams = new URLSearchParams({code , state}).toString();
            console.log(code, state);
             
            const url = `http://localhost:8000/api/login-intra/callback?${queryParams}`;
            console.log(`Sending GET request to: ${url}`);
            fetch(url, {
                method: 'POST',
                credentials: "include", 
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (!response.ok) {
                    // Throw an error with status code for better debugging
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {		
                if (data.access_token && data.refresh_token){
                    
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    // localStorage.setItem('intra_token', data.intra_token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('name', data.name);
                    clearURL();
                    connectWS(data.access_token);
                    console.log(history.state)
                    navigateTo('/home', true);
                    
                    // loadProfilePage();
                } else if (data.two_fa_required) {
                    localStorage.setItem('temp_token', data.temp_token);
                    localStorage.setItem('intra_token', data.intra_token);
                    localStorage.setItem('username', data.username);
                    navigateTo('/two-fa-login', true);
                } else {
                    clearURL();
                    showModalError("An error occurred. Try again later.");
                    navigateTo("/login");
                    // displayLoginError('Invalid credentials. Please try again.', 'login-form');
                }
            })
            .catch(error => {
                clearURL();
                // alert("Access denied. Try again later");
                if (error.message.includes("401")) {
                    showModalError("Unauthorized access. Please check your credentials.");
                } else if (error.message.includes("403")) {
                    showModalError("Access denied. You do not have permission.");
                } else {
                    showModalError("An error occurred. Try again later.");
                }
                navigateTo("/login");
                // displayLoginError('Invalid credentials. Please try again.', 'login-form');
            });
        }
};

export function showModalError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
        backdrop: false,
    });
}


