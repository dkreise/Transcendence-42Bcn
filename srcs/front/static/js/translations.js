const translations = {
    eng: {
        welcome: "Welcome home",
        greeting: "Hello",
    },
    cat: {
        welcome: "Benvingut a casa",
        greeting: "Hola",
    },
    esp: {
        welcome: "Bienvenido a casa",
        greeting: "Hola",
    }
};

function setTranslation(lang) {
    const langData = translations[lang] || translations.eng;
    document.getElementById("welcome-message").textContent = langData.welcome;
}