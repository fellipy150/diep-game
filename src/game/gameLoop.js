import { gameState, limparListaInPlace } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";
import { updateCamera, renderGame } from "./renderer.js";
import { Player } from "./player/player.js";
import { UpgradeSystem } from "./upgrades/index.js";
import { showLevelUpMenu } from "./ui/LevelUpMenu.js";
import { SynergyEngine } from "./synergies/index.js";
let lastTime = 0;
function handleProgress(player, gameState) {
    if (player.xp >= player.nextLevelXp) {
        player.level++;
        player.xp -= player.nextLevelXp;
        player.nextLevelXp = Math.floor(player.nextLevelXp * 1.2);
        gameState.isPaused = true;
        console.log("🕵️ [DEBUG 3] Player subiu de nível!");
        const choices = UpgradeSystem.getChoices(player, 4);
        console.log("🕵️ [DEBUG 4] Enviando escolhas para o Menu:", choices);
        showLevelUpMenu(choices, (selectedId) => {
            UpgradeSystem.apply(player, selectedId);
            SynergyEngine.evaluate(player);
            gameState.isPaused = false;
        });
    }
}
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
    player.update(dt);
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
            player.gainXp(40);
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
