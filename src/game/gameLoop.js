import { gameState, limparListaInPlace, fastRemove } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";

// 🎯 CORREÇÃO: Usando o arquivo index.js do player para limpar o aviso de arquivo não utilizado do Knip.
import { Player, handleProgress } from "./player/index.js";

import { resetCamera, updateCamera, renderGame } from "./renderer.js";
import PerfMonitor from "../core/PerfMonitor.js";
import { DOMManager } from "./ui/DOMManager.js"; // 🔴 Gerenciador HTML/CSS

let lastTime = 0;

export function startGameLoop() {
    gameState.player = new Player(1000, 1000);
    
    // 🔴 AJUSTE: A câmera agora só precisa saber quem ela segue!
    resetCamera(gameState.player); 
    
    // Inicia a Interface
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
    
    // Trava o dt em no máximo 100ms para evitar que a física "quebre" se a aba travar
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    const { player, isPaused, isGameOver, ctx, canvas } = gameState;
    
    // --- ATUALIZAÇÃO LÓGICA ---
    if (!isPaused && !isGameOver && player) {
        PerfMonitor.markStart('update:total');
        update(dt);
        PerfMonitor.markEnd('update:total');
    }
    
    // --- RENDERIZAÇÃO VISUAL ---
    if (player && ctx && canvas) {
        // 🔴 AJUSTE: Removemos width/height da assinatura
        updateCamera(player); 
        
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
    
    // 1. Player
    PerfMonitor.markStart('update:player');
    player.update(dt, gameState);
    PerfMonitor.markEnd('update:player');
    
    // 2. Spawner
    EnemySpawner.update(dt, gameState);
    
    // 3. Inimigos
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
    
    // 4. Colisões
    PerfMonitor.markStart('collision');
    processarColisoes();
    PerfMonitor.markEnd('collision');
    
    // 5. Limpeza de Memória
    limparListaInPlace(player.bullets);
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.bullets) limparListaInPlace(e.bullets);
    }
    
    // 6. Efeitos Visuais (Números de Dano subindo e sumindo)
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.y -= 40 * dt;
        n.life -= dt;
        if (n.life <= 0) fastRemove(damageNumbers, i);
    }
    
    // 7. Condição de Derrota
    if (player.hp <= 0) {
        gameState.isGameOver = true;
    }
    
    // --- 🔴 ATUALIZAÇÃO DA INTERFACE DOM ---
    DOMManager.updateHUD(player); // Barra de vida, XP, Peso
    DOMManager.updateAmmoUI(player.inventory); // Mostra os números da munição descendo!
    
    // --- LÓGICA DE LEVEL UP SEGURO ---
    if (gameState.pendingLevelUp) {
        gameState.isPaused = true;
        handleProgress(player, gameState);
        gameState.pendingLevelUp = false;
    }
}
