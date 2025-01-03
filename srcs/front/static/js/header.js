document.addEventListener("DOMContentLoaded", () => {
    const languageButton = document.getElementById("language-button");
    const languageMenu = document.getElementById("language-menu");

    const currentLang = location.pathname.split('/')[1] || 'eng';

    // Set initial language
    languageButton.textContent = currentLang.toUpperCase();
    setTranslation(currentLang);

    // Toggle the visibility of the language menu
    languageButton.addEventListener("click", () => {
        languageMenu.classList.toggle("d-none");
    });

    // Set the language on the button and hide the menu
    window.setLanguage = (lang) => {
        languageButton.textContent = lang.toUpperCase();
        setTranslation(lang);
        history.pushState(null, '', `/${lang}`);
        languageMenu.classList.add("d-none");
    };
});