/**
 * Gerenciamento de Estado Global do Jogo
 */

export const gameState = {
    player: null,
    enemies: [],
    hazards: [],
    damageNumbers: [],
    isPaused: false,
    isGameOver: false,
    canvas: document.getElementById("game"),
    ctx: null
};

// Inicializa o contexto se o canvas estiver disponível
if (gameState.canvas) {
    gameState.ctx = gameState.canvas.getContext("2d");
}

/**
 * Remove um item de um array de forma extremamente rápida (O(1)).
 * ATENÇÃO: Isso altera a ordem do array ao trocar o item removido pelo último.
 * Ideal para listas onde a ordem de renderização não é crítica (balas, inimigos).
 */
export function fastRemove(array, index) {
    const lastIndex = array.length - 1;
    if (index !== lastIndex) {
        // Joga o último elemento para o "buraco" do item que queremos remover
        array[index] = array[lastIndex]; 
    }
    // Remove o último elemento (que agora está duplicado ou era o alvo)
    array.pop(); 
}

/**
 * Varre uma lista e remove objetos marcados como "dead" usando Swap and Pop.
 * @param {Array} lista - Array de objetos que possuem a propriedade .dead
 */
export function limparListaInPlace(lista) {
    if (!lista) return;
    
    // Iteramos de trás para frente para evitar problemas com índices ao remover
    for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].dead) {
            fastRemove(lista, i); // Otimização O(1) substituindo o splice
        }
    }
}

/**
 * Cria e adiciona um efeito visual de dano ao estado global.
 * Implementa um teto de 25 elementos para evitar poluição visual e queda de FPS.
 */
export function criarNumeroDano(x, y, val, color) {
    // 🔴 CONTROLE DE DENSIDADE: 
    // Se houver muitos números na tela, removemos o mais antigo instantaneamente.
    // Isso mantém a performance estável mesmo em ataques de área massivos.
    if (gameState.damageNumbers.length > 25) {
        gameState.damageNumbers.shift(); 
    }

    gameState.damageNumbers.push({
        // Adiciona um pequeno "jitter" horizontal para que números simultâneos não fiquem sobrepostos
        x: x + (Math.random() - 0.5) * 20,
        y: y - 10,
        val: Math.floor(val),
        color: color,
        life: 1.0 // Duração do efeito em segundos
    });
}

