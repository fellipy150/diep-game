import { gameState, limparListaInPlace } from "./state.js";
import { processarColisoes } from "./physics.js";
import { desenharGameOver } from "./ui/index.js";
import { EnemySpawner } from "./enemySpawner.js";
import { Player } from "./player/player.js";
import { handleProgress } from "./player/progress.js";
import { resetCamera, updateCamera, renderGame } from "./renderer.js";

let lastTime = 0;
let loopId = 0; // Boa prática armazenar o ID do requestAnimationFrame

export function startGameLoop() {
    const { canvas } = gameState;
    
    gameState.player = new Player(1000, 1000);
    resetCamera(gameState.player, canvas.width, canvas.height);
    
    gameState.player.onLevelUp = () => {
        handleProgress(gameState.player, gameState);
    };
    
    // Inicia o tempo no momento exato em que o loop começa, evitando saltos (dt grande) no primeiro frame
    lastTime = performance.now(); 
    loopId = requestAnimationFrame(loop);
}

// O Segredo da Performance: Remoção O(1) (Swap and Pop)
// Substitui o item a ser removido pelo último da lista e descarta o final.
function fastRemove(array, index) {
    const last = array.length - 1;
    if (index !== last) {
        array[index] = array[last];
    }
    array.pop();
}

function loop(time) {
    // Chamar logo no início ajuda o navegador a agendar melhor o próximo frame
    loopId = requestAnimationFrame(loop); 

    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const { player, isPaused, isGameOver, ctx, canvas } = gameState;

    if (!isPaused && !isGameOver && player) {
        update(dt);
    }

    if (player && ctx && canvas) {
        updateCamera(player, canvas.width, canvas.height);
        renderGame(ctx, canvas, gameState);
    }

    if (isGameOver) {
        desenharGameOver();
    }
}

function update(dt) {
    const { player, enemies, hazards, damageNumbers } = gameState;

    player.update(dt, gameState);
    EnemySpawner.update(dt, gameState);

    // 1. Dano (Swap and Pop)
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.y -= 40 * dt;
        n.life -= dt;
        if (n.life <= 0) {
            fastRemove(damageNumbers, i);
        }
    }

    // 2. Inimigos (Swap and Pop)
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

    // 3. Hazards (Swap and Pop)
    for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.update(dt);
        if (h.dead) {
            fastRemove(hazards, i);
        }
    }

    // Física e Limpezas
    processarColisoes();
    limparListaInPlace(player.bullets);
    
    // Troca do `for...of` por um loop clássico. Em caminhos "quentes", 
    // for loops tradicionais são ligeiramente mais rápidos no motor V8 do Chrome.
    const enemiesLen = enemies.length;
    for (let i = 0; i < enemiesLen; i++) {
        limparListaInPlace(enemies[i].bullets);
    }

    if (player.hp <= 0) {
        gameState.isGameOver = true;
    }
}
