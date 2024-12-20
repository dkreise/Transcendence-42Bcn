var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event triggered");
    const contentArea = document.getElementById('content-area');
    const accessToken = localStorage.getItem('access_token');

    fetch('html/login_form.html')  // Call the API endpoint to get the form as JSON
        .then(response => response.text())
        .then(data => {
            if (data) {
                    console.log('Form html returned!');
                    contentArea.innerHTML = data;
            }
        })
        .catch(error => console.error('Error loading login form:', error));
});