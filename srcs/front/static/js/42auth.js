import { loadProfilePage } from "./profile.js";
import { displayLoginError } from "./login.js";
import { clearURL, navigateTo } from "./main.js"
 

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
        console.log(`Windows location is ${window.location.href}`)
        window.history.replaceState(null, null, '/');
        if (code && state){
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
            .then(response => response.json())
            .then(data => {		
                if (data.access_token && data.refresh_token){
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    localStorage.setItem('intra_token', data.intra_token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('name', data.name);
                    clearURL();
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
                    displayLoginError('Invalid credentials. Please try again.', 'login-form');
                }
            })
            .catch(error => {
                clearURL();
                displayLoginError('Invalid credentials. Please try again.', 'login-form');
            });
        }
};


