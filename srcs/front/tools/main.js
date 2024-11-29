var baseUrl = "http://localhost"; // change (parse) later

console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const contentArea = document.getElementById('content-area');
    // const signin = document.getElementById('signin');
    // const signin_link = document.getElementById('sign-in-link');


    // Function to load the login form dynamically via API
    loginButton.addEventListener('click', () => {
        console.log('Login button clicked!');
        loginButton.remove();
        fetch(baseUrl + ':8002/login-form/')  // Call the API endpoint to get the form as JSON
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

                            // Send form data via AJAX
                            const formData = new FormData(loginForm);
                            fetch(loginForm.action, {
                                method: 'POST',
                                body: formData,
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Handle successful login (redirect or update UI)
                                    alert('Login successful!');
                                    fetch(baseUrl + ':8002/user-info/', {
                                        method: 'GET',
                                        credentials: 'include',
                                    })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.user_html) {
                                                console.log('User html returned!');
                                                contentArea.innerHTML = data.user_html;
                                            } else {
                                                console.log('Error: No user html returned :(');
                                            }
                                        })
                                        .catch(error => console.error('Error loading user info:', error));
                                } else {
                                    alert('Login failed!');
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
                })
                .catch(error => console.error('Error loading Sign In form:', error));
        }
    });
});


