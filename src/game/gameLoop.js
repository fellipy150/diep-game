import { gameState, limparListaInPlace } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";
import { updateCamera, renderGame } from "./renderer.js";
import { Player } from "./player/player.js";
import { handleProgress } from "./player/progress.js";

let lastTime = 0;
export function startGameLoop() {
    gameState.player = new Player(gameState.canvas.width / 2, gameState.canvas.height / 2);
    gameState.player.onLevelUp = () => {
        handleProgress(gameState.player, gameState);
    };
    requestAnimationFrame(loop);
}
function loop(time) {
    if (lastTime === 0) {
        lastTime = time;
        requestAnimationFrame(loop);
        return;
    }
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    const { player, enemies, hazards, damageNumbers, isPaused, isGameOver, ctx, canvas } = gameState;
    if (!isPaused && !isGameOver && player) {
        update(dt);
    }
    if (player && ctx && canvas) {
        updateCamera(player, canvas.width, canvas.height);
        renderGame(ctx, canvas, player, enemies, hazards, damageNumbers);
    }
    if (isGameOver) {
        desenharGameOver();
    }
    requestAnimationFrame(loop);
}
function update(dt) {
    const { player, enemies, hazards, damageNumbers } = gameState;
    player.update(dt, gameState);
    EnemySpawner.update(dt, gameState);
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.y -= 40 * dt;
        n.life -= dt;
        if (n.life <= 0) damageNumbers.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dead) {
            enemies.splice(i, 1);
            if (e.killedByPlayer) {
                player.addXp(40);
            }
        } else {
            e.update(dt, player, enemies, hazards);
        }
    }
    for (let i = hazards.length - 1; i >= 0; i--) {
        hazards[i].update(dt);
        if (hazards[i].dead) hazards.splice(i, 1);
    }
    processarColisoes();
    limparListaInPlace(player.bullets);
    for (const e of enemies) {
        limparListaInPlace(e.bullets);
    }
    if (player.hp <= 0) {
        gameState.isGameOver = true;
    }
}
