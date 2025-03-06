import { checkPermission } from "./main.js"
import { drawHeader } from "./main.js";

var baseUrl = window.env.BASE_URL;
var userMgmtPort = window.env.USER_MGMT_PORT;

export const loadPageNotFound = async () => {
    const headerType = checkPermission() ? 1 : 2;

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