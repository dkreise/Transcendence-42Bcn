console.log('parti.js is loaded');

document.addEventListener("DOMContentLoaded", function () {
    const particleBackground = document.getElementById("particle-background");
    const particleCount = 300; // Número de partículas

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";

        // Posición horizontal aleatoria
        particle.style.left = `${Math.random() * 100}vw`;

        // Tamaño aleatorio de la partícula
        const size = Math.random() * 5 + 5; // Entre 5px y 10px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Duración y retraso de la animación
        particle.style.animationDuration = `${5 + Math.random() * 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;

        // Añadir la partícula al fondo
        particleBackground.appendChild(particle);
    }
});