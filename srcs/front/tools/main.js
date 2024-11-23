console.log('main.js is loaded');
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const contentArea = document.getElementById('content-area');

    // Function to load the login form dynamically via API
    loginButton.addEventListener('click', () => {
        console.log('Login button clicked!');
        fetch('http://localhost:8000/api/login-form/')  // Call the API endpoint to get the form as JSON
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
                            const usernameInput = document.getElementById('username');
                            const passInput = document.getElementById('password');
                            if (usernameInput && passInput) {
                                console.log('Username: ', usernameInput.value);
                                console.log('Password: ', passInput.value);
                            } else {
                                console.log('No username or password! :(');
                            }

                            const csrfToken = 'lala'//document.querySelector('[name="csrfmiddlewaretoken"]').value;
                            if (csrfToken) {
                                console.log('CSRF Token:', csrfToken);  // Check the CSRF token in the console
                            } else {
                                console.log('No csrgf token! :(');
                            }

                            // Send form data via AJAX
                            const formData = new FormData(loginForm);
                            fetch(loginForm.action, {
                                method: 'POST',
                                body: formData,
                                headers: {
                                    'X-CSRFToken': csrfToken || 'hardcoded-token',
                                },
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Handle successful login (redirect or update UI)
                                    alert('Login successful!');
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
});


