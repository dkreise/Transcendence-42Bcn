// Get the canvas element and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Initial position and size of the rectangle
let rectX = 50;
let rectY = 50;
const rectWidth = 50;
const rectHeight = 100;

// Speed of the rectangle
const speed = 2;

// Draw function to render the rectangle
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the rectangle
    ctx.fillStyle = "white"; // Set the rectangle color
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight); // Draw the rectangle

    // Update the rectangle's position
    rectX += speed;

    // Reset the rectangle position if it goes off the screen
    if (rectX > canvas.width) {
        rectX = -rectWidth; // Start from the left again
    }
}

// Call the draw function 60 times per second
setInterval(draw, 1000 / 60); // 60 FPS
