import { makeAuthenticatedRequest } from "./login.js";

document.addEventListener("headerLoaded", () => {
    const languageButton = document.getElementById("language-button");
    const languageMenu = document.getElementById("language-menu");

    // Get current language from cookies or default to 'eng'
    const getCookie = (name) => {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=');
            console.log('key ', key );
            if (key === name) return value;
        }
        return 'en'; // Default language
    };

    const currentLang = getCookie('language');

    if (languageButton) {
        languageButton.textContent = currentLang.toUpperCase();
    }

    // Toggle the visibility of the language menu
    if (languageButton && languageMenu) {
        languageButton.addEventListener("click", () => {
            languageMenu.classList.toggle("d-none");
        });
    }

    // Set the language on the button and hide the menu
    window.setLanguage = (lang) => {
        languageButton.textContent = lang.toUpperCase();
    
        // Set the cookie locally
        document.cookie = `language=${lang}; Secure; SameSite=None; path=/;`;

        // Send the request to update the language on the back-end
        makeAuthenticatedRequest("http://localhost:8000/api/save-user-pref-lang", {
            method: "POST",
            credentials: "include"  // This ensures cookies are sent along with the request 
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status !== "success") {
                    console.error('Failed to update language on the server.');
                }
            })
            .catch((error) => {
                console.error('Error updating language:', error);
            });
    
        //applyTranslations(lang); TODO
        //window.location.reload() //NOT SPA!!!!!

        // Hide the menu
        languageMenu.classList.add("d-none");
    };
});

export function updateLanguage(lang) {
    window.setLanguage(lang);
}