import { makeAuthenticatedRequest } from "./login.js";
import { displayUpdatingMessage } from "./profile.js";
import { navigateTo } from "./main.js";

var baseUrl = "http://localhost"; // change (parse) later

const display2FAMessage = (message, color) => {
    const twoFAForm = document.getElementById('two-fa-form');
    if (!twoFAForm)
        return;

    const existingError = document.getElementById('two-fa-update-error');
    if (existingError)
        existingError.remove();

    const errorMessage = document.createElement('div');
    errorMessage.id = 'two-fa-update-error';
    errorMessage.style.color = color;
    errorMessage.style.marginBottom = '15px';
    errorMessage.textContent = message;

    twoFAForm.prepend(errorMessage); //adding at the top of the login container
};

export const enable2FA = () => {
    makeAuthenticatedRequest(baseUrl + ":8000/api/2fa/enable/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success && data.setup_html) {
                document.getElementById('content-area').innerHTML = data.setup_html;
                document.getElementById("2fa-qr-code").src = `data:image/png;base64,${data.qr_code}`;
            } else {
                // alert(data.error || "Failed to enable 2FA.");
                console.error("Error while enabling 2FA.")
            }
        })
        .catch((error) => console.error("Error enabling 2FA:", error));
};

export const disable2FA = () => {
    makeAuthenticatedRequest(baseUrl + ":8000/api/2fa/disable/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log("2FA has been disabled.");
                navigateTo('/profile-settings', true);
                displayUpdatingMessage("2FA has been disabled.", 'green');
            } else {
                console.error("Error while disabling 2FA.");
            }
        })
        .catch((error) => console.error("Error disabling 2FA:", error));
};

const  verify2FA = () => {
    const codeInput = document.getElementById("2fa-code");
    const code = codeInput.value;
    if (!code) {
        // alert("Please enter the verification code."); // change to error message
        display2FAMessage("Please enter the verification code.", 'red');
        return;
    }

    // alert(code);
    makeAuthenticatedRequest(baseUrl + ":8000/api/2fa/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log("2fa code CORRECT !!");
                navigateTo('/profile-settings', true);
                displayUpdatingMessage("2FA has been enabled.", 'green');
            } else {
                console.log("Invalid or expired 2fa code.");
                display2FAMessage("Invalid or expired verification code.", 'red');
                // navigateTo('/profile-settings', true); // stay instead
            }
        })
        .catch((error) => console.error("Error verifying 2FA:", error));
    

    // fetch("http://localhost:8000/api/2fa/verify/", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    //     },
    //     body: JSON.stringify({ code: "123456" }),
    // })
    //     .then((response) => response.json())
    //     .then((data) => console.log("Response data:", data))
    //     .catch((error) => console.error("Fetch error:", error));
    //     alert("afaf");
    
};

document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");
    contentArea.addEventListener("submit", (event) => {
        if (event.target && event.target.id == "two-fa-form") {
            event.preventDefault();
            verify2FA();
        }
    });
});

