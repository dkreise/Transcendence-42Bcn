import { makeAuthenticatedRequest } from "./login.js";
import { checkPermission, navigateTo } from "./main.js";

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const userMgmtPort = window.env.USER_MGMT_PORT;

export function getUserPreferenceLanguageFromDB() {
    return makeAuthenticatedRequest(baseUrl + userMgmtPort + "/api/get-user-pref-lang", {
        method: "GET",
        credentials: "include"  // This ensures cookies are sent along with the request 
    })
    .then((response) => {
        if (!response) return null;
        return response.json();
    })
    .then((data) => {
        if (data && data.status === "success") {
            return data.language;
        } else {
            console.log("Failed to fetch user language preference:", data.message);
            return null;
        }
    })
    .catch((error) => {
        console.log("Error fetching user language preference:", error);
        return null;
    });
}

function setCookie(name, value) {
    document.cookie = `${name}=${value}; Secure; SameSite=None; path=/;`;
}

function saveUserPreferenceLanguageToDB(lang) {
    makeAuthenticatedRequest(baseUrl + userMgmtPort + "/api/save-user-pref-lang", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: lang }),
    })
    .then(response => response ? response.json() : null)
    .then((data) => {
        if (!data || data.status !== "success") {
            console.error('Failed to update language on the server.');
        }
    })
}

function updateLanguageButtonUI(lang) {
    const languageButton = document.getElementById("language-button");
    const languageMenu = document.getElementById("language-menu");

    if (languageButton) {
        languageButton.textContent = lang;
    }

    if (languageMenu) {
        languageMenu.classList.add("d-none"); // Hide the menu after updating
    }
}

export async function updateLanguage(lang) {
    let lang_is_defined = true; 
    
    //STEP 1: Get user language preference when login (no lang passed as parameter)
    if (!lang){
        lang_is_defined = false;
        lang = await getUserPreferenceLanguageFromDB();
    }

    //STEP 2: Set language cookies
    setCookie("language", lang);

    if (lang_is_defined && checkPermission()) {
        await saveUserPreferenceLanguageToDB(lang);
    }

    //STEP 4: Update button UI
    updateLanguageButtonUI(lang);

    //STEP 5: TODO: Update page (Pending Dina code)
    if (lang_is_defined) {
        navigateTo(window.location.pathname, true);
    }
}

document.addEventListener("headerLoaded", () => {
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
        // console.log('header event recived');
        const languageButton = document.getElementById("language-button");
        const languageMenu = document.getElementById("language-menu");

        // console.log("languageButton: ", languageButton);
        // console.log("language-menu: ", languageMenu);
    
        // Toggle the visibility of the language menu
        if (languageButton && languageMenu) {
            languageButton.addEventListener("click", () => {
                languageMenu.classList.toggle("d-none");
            });

            languageMenu.addEventListener("click", event => {
                const lang = event.target.getAttribute("data-lang");
                if (lang) {
                    updateLanguage(lang);
                }
            });
        }
    }
});
