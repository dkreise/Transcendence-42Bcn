import { checkPermission, drawHeader } from "./main.js"
import { getLanguageFromCookies } from "./langs.js";

const host = window.env.HOST;
const protocolWeb = window.env.PROTOCOL_WEB
const baseUrl = protocolWeb + "://" + host + ":";  
const userMgmtPort = window.env.USER_MGMT_PORT;

export const loadPageNotFound = async () => {
    const headerType = checkPermission() ? 'main' : 'login';

    try {
        await drawHeader(headerType);
        const response = await fetch(baseUrl + userMgmtPort + "/api/page-not-found/", {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        if (data.page_not_found_html) {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = data.page_not_found_html;
            } else {
                console.error('Content area not found');
            }
        } else {
            console.error('Failed to load error page.');
        }
    } catch (error) {
        console.error('Error loading page', error);
    }
};

export function showModalError(msg) {
    const dict = {
        "EN": {
            "ACCESS_DENIED": "Access denied",
            "ERROR": "An error occurred."
        },
        "ES": {
            "ACCESS_DENIED": "Acceso denegado",
            "ERROR": "Ocurrió un error."
        },
        "CA": {
            "ACCESS_DENIED": "Accés denegat",
            "SERVER_ERROR": "S'ha produït un error." // Added translation
        },
        "RU": {
            "ACCESS_DENIED": "Доступ запрещен",
            "SERVER_ERROR": "Произошла ошибка."
        },
        "LV": {
            "ACCESS_DENIED": "Prieiga uždrausta",
            "SERVER_ERROR": "Įvyko klaida."
        }
    };

    getLanguageFromCookies().then((lang) => {
        lang = lang || "EN";
        const message = dict[lang]?.[msg] || dict["EN"][msg] || "An error occurred.";
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            backdrop: false,
        });
    });
}