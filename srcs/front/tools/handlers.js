export function handleRoleAssignment(data, player, opponent, ball, canvas) {
    if (data.role === "player1") {
        player.x = 0;
        opponent.x = canvas.width - opponent.width;
        ball.isGameMaster = true;
    } else if (data.role === "player2") {
        player.x = canvas.width - player.width;
        opponent.x = 0;
    }
}

export function handlePaddleMove(data, player, opponent) {
    if (data.player !== (player.x === 0 ? "player1" : "player2")) {
        opponent.update(data.position);
    }
}

export function handleBallPosition(data, ball) {
    ball.update(data.xpos, data.ypos);
}

export function handleScoreUpdate(data, player, opponent, ctx, gameLoopId) {
    if (data.player === "player1") {
        player.score = data.score;
    } else {
        opponent.score = data.score;
    }

    if (data.score >= player.maxScore)
    {
        cancelAnimationFrame(gameLoopId);
        const finalScore = `${player.score} - ${opponent.score}`;

        const isLocalPlayerWinner =
            (data.player === "player1" && player.x === 0) || 
            (data.player === "player2" && player.x > 0);

        if (!isLocalPlayerWinner) {
            player.displayEndgameMessage(ctx, finalScore);
        } else {
            opponent.displayEndgameMessage(ctx, finalScore);
        }
    }
}