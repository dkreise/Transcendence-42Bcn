import { loadLoginPage, handleSignup } from "./login.js";
import { loadProfilePage } from "./profile.js";
import { handleLoginIntra, handle42Callback } from "./42auth.js";

const routes = {
    '/': homePage,
    // '/login': (args) => loadLoginPage(args),
    '/signup': handleSignup,
    '/login-intra': handleLoginIntra, 
    '/callback': handle42Callback,
    '/profile': loadProfilePage,
    // '/logout':  
    // '/options': optionsPage,
    // '/localgame': localGamePage,
    // '/aigame': aiGamePage,
    // '/tournament': tournamentPage
};

function router() {
    const path = window.location.pathname;
    if (routes[path] && path === '/login')
        routes[path](document.getElementById('content-area'));
    else if (routes[path]) {
        routes[path](); // Call the function associated with the path
    } else {
        console.log(`Route ${path} not handled`);
        // renderNotFound(); // Handle unknown routes
    }
}

export function navigateTo(path, replace = false) {
    if (replace) {
        history.replaceState(null, null, path);
    }
    else {
        history.pushState(null, null, path);
    }

    router();
}

export function clearURL() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
}

function homePage() {
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        console.log('we have access token');
        console.log('navigating to profile..');
        navigateTo('/profile');
    }
    else {
        console.log('we do not have access token..');
        // console.log('navigating to login..');
        // navigateTo('/login');
        loadLoginPage(contentArea);
        console.log('loading login..');
    }
}
// window.addEventListener('popstate', router);

var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");

    // window.addEventListener('popstate', router);

    window.addEventListener('popstate', (event) => {
        if (event.state?.fromOAuth) {
            console.log('Skipping OAuth redirect in history');
            const previousPath = event.state.previousPath || '/';
            // const previousPath = '/';
            navigateTo(previousPath, true);
        } else {
            router();
        }
    })
    
    // Event delegation for data-route attributes
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // Check if the clicked element has the 'data-route' attribute
        if (target && target.hasAttribute('data-route')) {
            const route = target.getAttribute('data-route');
            navigateTo(route, true);
        }
    });

    router();


    // Function to handle route changes based on data-route
    // const handleRoute = (route) => {
    //     switch (route) {
    //         case 'login-intra':
    //             // Trigger login-intra OAuth flow
    //             console.log('login 42 clicked');
    //             window.location.href = "http://localhost:8000/api/login-intra";  // Backend redirect
    //             break;

    //         // Add other cases for different routes if needed
    //         default:
    //             console.log(`Route ${route} not handled`);
    //     }
    // };

    

    // const handleOAuthCallback = () => {
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const code = urlParams.get('code');
    //     const state = urlParams.get('state');
    //     if (code && state){
    //         const queryParams = new URLSearchParams({code , state}).toString();
    //         console.log(code, state);
            
    //         const url = `http://localhost:8000/api/login-intra/callback?${queryParams}`;
    //         console.log(`Sending GET request to: ${url}`);
    //         fetch(url, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //         })
    //         .then(response => response.json())
    //         .then(data => {		
    //             if (data.access_token && data.refresh_token){
    //                 localStorage.setItem('access_token', data.access_token);
    //                 localStorage.setItem('refresh_token', data.refresh_token);
    //                 localStorage.setItem('intra_token', data.intra_token);
    //                 clearURL();
    //                 loadUserInfo();
    //             }else{
    //                 clearURL();
    //                 displayLoginError('Invalid credentials. Please try again.', 'login-form');
    //             }
    //         })
    //         .catch(error => {
    //             clearURL();
    //             displayLoginError('Invalid credentials. Please try again.', 'login-form');
    //         });
    //     }
    // };
    
    // if (window.location.pathname === '/callback') {
    //     handleOAuthCallback();
    // }

    // const loginButton = document.getElementById('login-button');
    // const contentArea = document.getElementById('content-area');
    // const accessToken = localStorage.getItem('access_token');
    // console.log("Access token:", accessToken);
    // const signin = document.getElementById('signin');
    // const signin_link = document.getElementById('sign-in-link');
    // Check if we have a code in the URL
    

    // function refreshAccessToken(){
    //     console.log("holaaaaaaaa");
    //     const refreshToken = localStorage.getItem("refresh_token");
    //     if (!refreshToken) {
    //         console.error("No refresh token found. User needs to log in again.");
    //         return Promise.reject("No refresh token available");
    //     }

    //     return fetch(baseUrl + ":8000/api/token/refresh/", {
    //         method: "POST",
    //         headers: {"Content-Type": "application/json"},
    //         body: JSON.stringify({refresh: refreshToken}),
    //     })
    //     .then((response) => {
    //         if (response.ok) {
    //             return response.json();
    //         } else {
    //             console.error("Refresh token invalid or expired.");
    //             handleLogout();
    //             return Promise.reject("Refresh token invalid or expired.");
    //         }
    //     })
    //     .then((data) => {
    //         if (data.access) {
    //             localStorage.setItem("access_token", data.access);
    //             return data.access;
    //         }
    //     });
    // };

    // const makeAuthenticatedRequest = (url, options = {}) => {
    //     const accessToken = localStorage.getItem("access_token");
    //     if (!accessToken) {
    //         console.error("No access token available.");
    //         return Promise.reject("No access token.");
    //     }

    //     options.headers = {
    //         ...options.headers,
    //         Authorization: `Bearer ${accessToken}`, // adding authorization header with the access token
    //     };

    //     return fetch(url, options).then((response) => {
    //         if (response.status === 401) {
    //             console.log("Access token expired, attempting refresh..");
    //             return refreshAccessToken().then((newAccessToken) => {
    //                 options.headers["Authorization"] = `Bearer ${newAccessToken}`;
    //                 return fetch(url, options); //retry the original request
    //             });
    //         } else {
    //             return response; // means that response is valid
    //         }
    //     });
    // };

    // // code = getParameterByName('code');
    // // console.log('code:', code)
    // // if (code)
    // // {
    // //     console.log('we got code');
    // // }


    // const loadUserInfo = () => {
    //     //makeAuthenticatedRequest(baseUrl + ":8000/api/user-info/", {method: "GET"})
    //     makeAuthenticatedRequest(baseUrl + ":8000/api/profile-page/", {method: "GET"})
    //     .then((response) => {
    //         if (response.ok) {
    //             return response.json();
    //         } else {
    //             console.error("Failed to load user info");
    //         }
    //     })
    //     .then((data) => {
    //         // if (data && data.user_html) {
    //         //     loginButton.remove();
    //         //     contentArea.innerHTML = data.user_html;
    //         //     addLogoutListener();
    //         // }
    //         if (data && data.profile_html) {
    //             loginButton.remove();
    //             contentArea.innerHTML = data.profile_html;
    //             addLogoutListener();
    //         }
    //     })
    //     .catch((error) => console.error("Error loading user info:", error));
    // };

    // if (accessToken) {
    //     console.log('we have access token');
    //     loadUserInfo();
    // }
    // else {
    //     console.log('we do not have access token..');
    // }

    // function getParameterByName(name, url) {
    //     if (!url) url = window.location.href;
    //     name = name.replace(/[[]]/g, "\\$&");
    //     var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    //         results = regex.exec(url);
    //     if (!results) return null;
    //     if (!results[2]) return '';
    //     return decodeURIComponent(results[2].replace(/\+/g, " "));
    // }
    // // Function to load the login form dynamically via API
    // loginButton.addEventListener('click', () => {
    //     console.log('Login button clicked!');
    //     loginButton.remove();
    //     fetch('html/login_form.html')  // Call the API endpoint to get the form as JSON
    //     .then(response => response.text())
    //     .then(data => {
    //         if (data) {
    //                 console.log('Form html returned!');
    //                 contentArea.innerHTML = data;  // Insert the form into the content area

    //                 //intra button
    //                 const intra_button = document.getElementById('login_intra_button');
    //                 intra_button.addEventListener('click', () => {
    //                     console.log('login 42 clicked');
    //                     window.location.href = "http://localhost:8000/api/login-intra";

    //                 })

    //                 // Add event listener for form submission
    //                 const loginForm = document.getElementById('login-form');
    //                 if (loginForm) {
    //                     loginForm.addEventListener('submit', (event) => {
    //                         event.preventDefault();  // Prevent the default form submission
    //                         console.log('Submit button clicked!');

    //                         const formData = new FormData(loginForm);
    //                         fetch(loginForm.action, {
    //                             method: 'POST',
    //                             body: JSON.stringify(Object.fromEntries(formData)),
    //                             headers: { 'Content-Type': 'application/json' }

    //                         })
    //                         .then(response => response.json())
    //                         .then(data => {
    //                             if (data.success) {

    //                                 //alert('Login successful!');
    //                                 localStorage.setItem('access_token', data.tokens.access);
    //                                 localStorage.setItem('refresh_token', data.tokens.refresh);
    //                                 loadUserInfo();
    //                             } else {
    //                                 //alert('Login failed!');
    //                                 displayLoginError('Invalid credentials. Please try again.', 'login-form');
    //                             }
    //                         })
    //                         .catch(error => {
    //                             console.error('Error logging in:', error);
    //                             alert('An error occurred during login.');
    //                         });
    //                     });
    //                 }
    //             } else {
    //                 console.error('Error: No form HTML returned');
    //             }
    //         })
    //         .catch(error => console.error('Error loading login form:', error));
    // });

    // contentArea.addEventListener('click', (event) => {
    //     if (event.target && event.target.id === 'signup-link') {
    //         event.preventDefault();
    //         console.log('Sign In button clicked!');
    //         //const signin = document.getElementById('signin');
    //         const loginForm = document.getElementById('login-form');
    //         // if (signin)
    //         //     signin.remove();
    //         if (loginForm)
    //             loginForm.remove();
    //         fetch('html/signup_form.html')
    //             .then(response => response.text())
    //             .then(html => {
    //                 contentArea.innerHTML = html;
    //                 const signupForm = document.getElementById('signup-form');
    //                 if (signupForm) {
    //                     signupForm.addEventListener('submit', (event) => {
    //                         event.preventDefault();
    //                         console.log('Submit of sign up clicked!');
    //                         const formData = new FormData(signupForm);
    //                         fetch(signupForm.action, {
    //                             method: 'POST',
    //                             body: JSON.stringify(Object.fromEntries(formData)),
    //                             headers: {'Content-Type': 'application/json'}
    //                         })
    //                         .then(response => response.json())
    //                         .then(data => {
    //                             if (data.success) {
    //                                 localStorage.setItem('access_token', data.tokens.access);
    //                                 localStorage.setItem('refresh_token', data.tokens.refresh);
    //                                 loadUserInfo();
    //                             } else {
    //                                 displayLoginError(data.error + ' Please try again.', 'signup-form');
    //                             }
    //                         })
    //                     })
    //                 }
    //             })
    //             .catch(error => console.error('Error loading Sign In form:', error));
    //     }
    // });  

    // const displayLoginError = (message, form) => {
    //     const loginContainer = document.getElementById('login-container');
    //     if (!loginContainer)
    //         return;

    //     const existingError = document.getElementById('login-error');
    //     if (existingError)
    //         existingError.remove();

    //     const errorMessage = document.createElement('div');
    //     errorMessage.id = 'login-error';
    //     errorMessage.style.color = 'red';
    //     errorMessage.style.marginBottom = '15px';
    //     errorMessage.textContent = message;

    //     loginContainer.prepend(errorMessage); //adding at the top of the login container
        
    //     // const loginForm = document.getElementById('login-form');
    //     const loginForm = document.getElementById(form);
    //     if (loginForm) {
    //         loginForm.reset();  // to clear the form
    //     }
    // };

    // // const displaySignUpError = (message) => {
    // //     const 
    // // }

    // const handleLogout = () => {
    //     console.log('Logging out..');

    //     localStorage.removeItem('access_token');
    //     localStorage.removeItem('refresh_token');
    //     localStorage.removeItem('intra_token');
    //     // there can be fetch to back if need to inform backend that user is logging out (optional)

    //     contentArea.innerHTML = ''; // to clear user content
    //     const loginButton = document.createElement('button');
    //     loginButton.id = 'login-button';
    //     loginButton.textContent = 'LOGIN';
    //     loginButton.onclick = () => location.reload(); //reload the page to show the button
    //     contentArea.appendChild(loginButton);
    // };

    // const addLogoutListener = () => {
    //     const logoutButton = document.getElementById('logout-button');
    //     if (logoutButton) {
    //         logoutButton.addEventListener('click', handleLogout);
    //     }
    // };
});
