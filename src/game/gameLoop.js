import { gameState, limparListaInPlace } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";
import { Player } from "./player/player.js";
import { handleProgress } from "./player/progress.js";
import { resetCamera, updateCamera, renderGame } from "./renderer.js";
import PerfMonitor from "../core/PerfMonitor.js";
import { fastRemove } from "./state.js";

let lastTime = 0;

/**
 * Inicializa o estado do jogador e inicia o ciclo de vida do jogo.
 */
export function startGameLoop() {
    const { canvas } = gameState;
    
    // Posiciona o jogador no centro do mapa
    gameState.player = new Player(1000, 1000);
    resetCamera(gameState.player, canvas.width, canvas.height);
    
    // Agora o callback de Level Up apenas sinaliza o progresso, 
    // mas o gerenciamento de pausa ocorre no final do update.
    gameState.player.onLevelUp = () => {
        // Logica de backup caso necessária
    };
    
    requestAnimationFrame(loop);
}

/**
 * Ciclo principal de animação e lógica.
 */
function loop(time) {
    // 🔴 INÍCIO DA MEDIÇÃO DO FRAME
    PerfMonitor.frameStart(time);

    if (lastTime === 0) {
        lastTime = time;
        requestAnimationFrame(loop);
        return;
    }

    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const { player, isPaused, isGameOver, ctx, canvas } = gameState;

    // --- 1. LÓGICA DE ATUALIZAÇÃO ---
    // Só atualizamos se o jogo não estiver pausado (por Level Up ou Menu)
    if (!isPaused && !isGameOver && player) {
        PerfMonitor.markStart('update:total');
        update(dt);
        PerfMonitor.markEnd('update:total');
    }

    // --- 2. RENDERIZAÇÃO ---
    if (player && ctx && canvas) {
        updateCamera(player, canvas.width, canvas.height);
        
        PerfMonitor.markStart('render:total');
        renderGame(ctx, canvas, gameState);
        PerfMonitor.markEnd('render:total');
    }

    if (isGameOver) {
        desenharGameOver();
    }

    // 🔴 FIM DA MEDIÇÃO DO FRAME
    PerfMonitor.frameEnd();
    
    requestAnimationFrame(loop);
}

/**
 * Processa a física, IA e limpeza de objetos mortos.
 * Otimizado para adiar eventos de UI pesada.
 */
function update(dt) {
    const { player, enemies, hazards, damageNumbers } = gameState;

    // Medição: Jogador
    PerfMonitor.markStart('update:player');
    player.update(dt, gameState);
    PerfMonitor.markEnd('update:player');

    // Medição: Spawner de Inimigos
    EnemySpawner.update(dt, gameState);

    // Medição: IA e Movimento dos Inimigos
    PerfMonitor.markStart('update:enemies');
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dead) {
            if (e.killedByPlayer) {
                // Soma XP, mas não abre UI ainda
                player.addXp(40); 
            }
            fastRemove(enemies, i);
        } else {
            e.update(dt, player, enemies, hazards);
        }
    }
    PerfMonitor.markEnd('update:enemies');

    // Medição: Física e Detecção de Colisão
    PerfMonitor.markStart('collision');
    processarColisoes();
    PerfMonitor.markEnd('collision');

    // Limpeza de projéteis (In-Place)
    limparListaInPlace(player.bullets);
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.bullets) {
            limparListaInPlace(e.bullets);
        }
    }

    // Atualização dos números de dano (VFX)
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.y -= 40 * dt;
        n.life -= dt;
        if (n.life <= 0) fastRemove(damageNumbers, i);
    }

    // Verificação de derrota
    if (player.hp <= 0) {
        gameState.isGameOver = true;
    }

    // --- 🔴 CHECAGEM DE LEVEL UP (Fora dos loops quentes) ---
    // Isso garante que a física terminou e o estado do jogo está estável
    // antes de pausar e abrir o menu de upgrades.
    if (player.xp >= player.xpNeeded) {
        gameState.isPaused = true; // Pausa o motor físico
        handleProgress(player, gameState); // Abre a UI pesada
    }
}

