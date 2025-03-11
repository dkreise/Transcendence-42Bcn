import { clearURL, navigateTo } from "./main.js";
import { connectWS } from "./onlineStatus.js";
import { getDictFor3DGame } from "./game.js";
import { getUserPreferenceLanguageFromDB } from "./langs.js";

const userMgmtPort = window.env.USER_MGMT_PORT;
const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  

export const handleLoginIntra = () => {
    console.log(`login 42 clicked: ${window.location.pathname}`);
    const currentPath = '/';
    window.history.replaceState({ fromOAuth: true, previousPath: currentPath  }, null, '/');
    console.log(history.state)
    window.location.href = baseUrl + userMgmtPort + "/api/login-intra";
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
            const url = baseUrl + userMgmtPort + `/api/login-intra/callback?${queryParams}`;
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
            .then(async data => {		
                if (data.access_token && data.refresh_token){
                    
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    clearURL();
                    await connectWS(data.access_token);
                    console.log(history.state)
                    navigateTo('/home', true);
                    
                    // loadProfilePage();
                } else if (data.two_fa_required) {
                    localStorage.setItem('temp_token', data.temp_token);
                    localStorage.setItem('intra_token', data.intra_token);
                    navigateTo('/two-fa-login', true);
                } else {
                    clearURL();
                    showModalError();
                    navigateTo("/login");
                    // displayLoginError('Invalid credentials. Please try again.', 'login-form');
                }
            })
            .catch(error => {
                clearURL();
                // alert("Access denied. Try again later");
                if (error.message.includes("401")) {
                    showModalError();
                } else if (error.message.includes("403")) {
                    showModalError();
                } else {
                    showModalError();
                }
                navigateTo("/login");
                // displayLoginError('Invalid credentials. Please try again.', 'login-form');
            });
        } else {
            console.log(`No relevant information provided in callback`);
            // alert("Access denied. Try again later");
            clearURL();
            navigateTo("/login");
            // displayLoginError('Invalid credentials. Please try again.', 'login-form');
        }
};

export function showModalError() {
	const dict = {
		"EN": "Access denied",
		"ES": "Acceso denegado",
		"CA": "Accés denegat",
		"RU": "Доступ запрещен",
		"LV": "Prieiga uždrausta",
	};
	//const lang = getUserPreferenceLanguageFromDB() || 'EN';
	const lang = 'EN';
	console.log("lang: " + JSON.stringify(lang));
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: dict[lang],
        backdrop: false,
    });
}
