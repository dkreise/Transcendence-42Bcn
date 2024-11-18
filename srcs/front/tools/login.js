// login.js

// Seleccionar el formulario y el contenedor de errores
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

// Escuchar el evento de envío del formulario
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitar que el formulario recargue la página

    // Obtener los valores de los campos
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        // Enviar las credenciales al backend con fetch
        const response = await fetch("http://localhost:3000/api/login", {
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
            window.location.href = "/home"; // Redirigir a la página de inicio o dashboard
        } else {
            // Mostrar mensaje de error si la autenticación falla
            errorMessage.textContent = "Invalid username or password";
        }
    } catch (error) {
        console.error("Error during login:", error);
        errorMessage.textContent = "An error occurred. Please try again.";
    }
});
