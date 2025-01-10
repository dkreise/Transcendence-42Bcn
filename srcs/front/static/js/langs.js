import { makeAuthenticatedRequest } from "./login.js";

export function updateLanguage(lang) {

    //Set language in cookies
    document.cookie = `language=${lang}; Secure; SameSite=None; path=/;`;
    
    //Save lang in bbdd **ONLY IF UPDATED COMES FROM BUTTON 
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

    window.setLanguage(lang);
}

document.addEventListener("langButtonLoaded", () => {
    const languageButton = document.getElementById("language-button");
    const languageMenu = document.getElementById("language-menu");

    // Get current language from cookies or default to 'en'
    const getCookie = (name) => {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=');
            console.log('key ', key );
            if (key === name) return value;
        }
        return 'en';
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

    languageMenu.addEventListener("click", event => {
        const lang = event.target.getAttribute("data-lang");
        if (lang) {
            updateLanguage(lang);
        }
    });

    // Set the language on the button and hide the menu
    window.setLanguage = (lang) => {
        languageButton.textContent = lang.toUpperCase();
        languageMenu.classList.add("d-none");
    };
});
