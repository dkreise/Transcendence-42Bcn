document.addEventListener('DOMContentLoaded', function () {
    
    console.log("login.js loaded");

    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    // Escuchar el evento de envío del formulario
    loginForm.addEventListener("submit", async (event) => {
        console.log("Form submission triggered");
        event.preventDefault(); // Evitar que el formulario recargue la página

        // Obtener los valores de los campos
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        console.log("Datos recividos:", username, password);

        try {
            // Enviar las credenciales al backend con fetch
            const response = await fetch("http://localhost:8000/api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            // Comprobar si la respuesta es exitosa
            if (response.ok) {
                const data = await response.json();
                console.log("Login successful:", data);
                //window.location.href = "/home"; // Redirigir a la página de inicio o dashboard
            } else {
                document.getElementById('error-message').textContent = errorData.error || 'Login failed!';
                console.log("Error: Authentication failed");
            }
        } catch (error) {
            console.error("Error during login:", error);
            // errorMessage.textContent = "An error occurred. Please try again.";
        }
    });
});
