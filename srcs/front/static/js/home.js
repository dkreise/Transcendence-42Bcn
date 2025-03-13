import { makeAuthenticatedRequest } from "./login.js";
import { drawHeader } from "./main.js";
import { getOrInitialize3DOption } from "./game.js";
import { updateHandlers } from "./tournament.js"

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const userMgmtPort = window.env.USER_MGMT_PORT;

export const setUp3DListener = () => {
    const switch3D = document.getElementById("3D-switch");

    if (switch3D) {
        const isEnable = getOrInitialize3DOption() === "true";
        switch3D.checked = isEnable;

        console.log("3D-option is:", switch3D.checked);
        switch3D.addEventListener("change", () => {
            localStorage.setItem("3D-option", switch3D.checked);
            updateHandlers(localStorage.getItem("3D-option") === "true");
        });
    } else {
        console.log("Switch not found =(");
    }
};

export const loadHomePage = () => {
    // console.log('Loading home page...');
    drawHeader('main').then(() => {
    return makeAuthenticatedRequest(baseUrl + userMgmtPort + "/api/home-page/", {
        method: "GET",
        credentials: "include"
        });
    })
    .then((response) => {
           // console.log('Response received:', response); // Log para confirmar la respuesta
            if (!response) return null;
            if (response.ok) {
                // console.log('Response is OK');
                return response.json();
            } else {
                console.error("Failed to load home page:", response.status, response.statusText);
                return null; // Aseguramos que no se siga al siguiente `.then`
            }
        })
        .then((data) => {
            // console.log('Data received:', data); // Log para depurar el JSON recibido
            if (data && data.home_html) {
                // console.log('2');
                document.getElementById('content-area').innerHTML = data.home_html;
                // console.log('Home page loaded');
                if (!localStorage.getItem("3D-option")) {
                    localStorage.setItem("3D-option", "false")
                }
                setUp3DListener();

            } else {
                console.log("home_html not found in the response data");
            }
        })
        .catch((error) => console.log("Error loading home page:", error));
};
