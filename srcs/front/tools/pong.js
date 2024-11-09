const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas, 0);
const opponent = new Player(canvas);

const ball = new Ball(canvas);

player.draw(ctx);
opponent.draw(ctx);
ball.draw(ctx);

// Keydown event
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') player.up = true;
    if (e.key === 's') player.down = true;
    if (e.key === 'ArrowUp') opponent.up = true;
    if (e.key === 'ArrowDown') opponent.down = true;
});

// Keyup event
window.addEventListener('keyup', (e) => {
    if (e.key === 'w') player.up = false;
    if (e.key === 's') player.down = false;
    if (e.key === 'ArrowUp') opponent.up = false;
    if (e.key === 'ArrowDown') opponent.down = false;
});

let gameLoopId = requestAnimationFrame(gameLoop);

function gameLoop()
{
    gameLoopId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0,0, canvas.width, canvas.height);
    player.draw(ctx);
    opponent.draw(ctx);
    ball.draw(ctx);

    player.move();
    opponent.move();
    ball.move(player, opponent, gameLoopId);
}

gameLoop();