import { gameState, limparListaInPlace, fastRemove } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";
import { Player } from "./player/player.js";
import { handleProgress } from "./player/progress.js";
import { resetCamera, updateCamera, renderGame } from "./renderer.js";
import PerfMonitor from "../core/PerfMonitor.js";
import { DOMManager } from "./ui/DOMManager.js";
 // 🔴 Import do Gerenciador HTML/CSS
let lastTime = 0;
export function startGameLoop() {
    const { canvas } = gameState;
    gameState.player = new Player(1000, 1000);
    resetCamera(gameState.player, canvas.width, canvas.height);
    DOMManager.init(gameState.player);
    DOMManager.updateHotbar(gameState.player.inventory);
    gameState.player.onLevelUp = () => {
        gameState.pendingLevelUp = true;
    };
    requestAnimationFrame(loop);
}
function loop(time) {
    PerfMonitor.frameStart(time);
    if (lastTime === 0) {
        lastTime = time;
        requestAnimationFrame(loop);
        return;
    }
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    const { player, isPaused, isGameOver, ctx, canvas } = gameState;
    if (!isPaused && !isGameOver && player) {
        PerfMonitor.markStart('update:total');
        update(dt);
        PerfMonitor.markEnd('update:total');
    }
    if (player && ctx && canvas) {
        updateCamera(player, canvas.width, canvas.height);
        PerfMonitor.markStart('render:total');
        renderGame(ctx, canvas, gameState);
        PerfMonitor.markEnd('render:total');
    }
    if (isGameOver) {
        desenharGameOver();
    }
    PerfMonitor.frameEnd();
    requestAnimationFrame(loop);
}
function update(dt) {
    const { player, enemies, hazards, damageNumbers } = gameState;
    PerfMonitor.markStart('update:player');
    player.update(dt, gameState);
    PerfMonitor.markEnd('update:player');
    EnemySpawner.update(dt, gameState);
    PerfMonitor.markStart('update:enemies');
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dead) {
            if (e.killedByPlayer) {
                player.addXp(40);
            }
            fastRemove(enemies, i);
        } else {
            e.update(dt, player, enemies, hazards);
        }
    }
    PerfMonitor.markEnd('update:enemies');
    PerfMonitor.markStart('collision');
    processarColisoes();
    PerfMonitor.markEnd('collision');
    limparListaInPlace(player.bullets);
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.bullets) {
            limparListaInPlace(e.bullets);
        }
    }
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.y -= 40 * dt;
        n.life -= dt;
        if (n.life <= 0) fastRemove(damageNumbers, i);
    }
    if (player.hp <= 0) {
        gameState.isGameOver = true;
    }
    DOMManager.updateHUD(player);
    if (gameState.pendingLevelUp) {
        gameState.isPaused = true;
        handleProgress(player, gameState);
        gameState.pendingLevelUp = false;
    }
}
