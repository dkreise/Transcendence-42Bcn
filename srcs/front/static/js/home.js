import { makeAuthenticatedRequest } from "./login.js";
import { drawHeader } from "./main.js";

var baseUrl = "http://localhost";

//Add to fetch:
// const Enable3D = localStorage.getItem("3D-option") === "true";
// "3d-option": Enable3D ? "True" : "False",

export const setUp3DListener = () => {
    const switch3D = document.getElementById("3D-switch"); // ID del switch

    if (switch3D) {
        const isEnable = localStorage.getItem("3D-option") === "true";
        switch3D.checked = isEnable;

        // Escuchar cambios en el switch
        console.log("3D-option is:", switch3D.checked);
        switch3D.addEventListener("change", () => {
            localStorage.setItem("3D-option", switch3D.checked);
        });
    } else {
        console.log("Switch not found =(");
    }
};

export const loadHomePage = () => {
    console.log('Loading home page...');
    drawHeader(1).then(() => {
    return makeAuthenticatedRequest(baseUrl + ":8000/api/home-page/", {
        method: "GET",
        credentials: "include"
        });
    })
    .then((response) => {
            console.log('Response received:', response); // Log para confirmar la respuesta
            if (response.ok) {
                console.log('Response is OK');
                return response.json();
            } else {
                console.error("Failed to load home page:", response.status, response.statusText);
                return null; // Aseguramos que no se siga al siguiente `.then`
            }
        })
        .then((data) => {
            console.log('Data received:', data); // Log para depurar el JSON recibido
            if (data && data.home_html) {
                console.log('2');
                document.getElementById('content-area').innerHTML = data.home_html;
                console.log('Home page loaded');

                if (!localStorage.getItem("3D-option")) {
                    localStorage.setItem("3D-option", "false")
                }
                setUp3DListener();

            } else {
                console.error("home_html not found in the response data");
            }
        })
        .catch((error) => console.log("Error loading home page:", error));
};
