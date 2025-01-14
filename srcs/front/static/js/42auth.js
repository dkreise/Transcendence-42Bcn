import { loadProfilePage } from "./profile.js";
import { displayLoginError } from "./login.js";

var baseUrl = "http://localhost";

function clearURL() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
}

export const do42auth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const url = `http://localhost:8000/api/login-intra/callback?${queryParams}`;
		console.log(`Sending GET request to: ${url}`);
        fetch(url, {
			method: 'GET',
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
				clearURL();
                loadProfilePage();
			} else {
                clearURL();
                displayLoginError('Invalid credentials. Please try again.', 'login-form');
			}
		})
		.catch(error => {
			clearURL();
            displayLoginError('Invalid credentials. Please try again.', 'login-form');
		});
};

document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");

    contentArea.addEventListener('click', (event) => {
        if (event.target && event.target.id === "login_intra_button") {
            console.log('login 42 clicked');

            window.location.href = "http://localhost:8000/api/login-intra";
        }
    });
});
