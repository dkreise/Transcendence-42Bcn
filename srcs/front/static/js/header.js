import { updateLanguage } from "./langs.js";

document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header-container");
    console.log("header.js is loaded");

    if (headerContainer) {
        fetch("../html/header.html")
            .then(response => response.text())
            .then((html) => {
                headerContainer.innerHTML = html;
                
                // Dispatch an event to signal that the header has been loaded
                document.dispatchEvent(new Event("langButtonLoaded"));
            })
            .catch((error) => {
                console.error("Error loading header:", error);
            });
    }
});