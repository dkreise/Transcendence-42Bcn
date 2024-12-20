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