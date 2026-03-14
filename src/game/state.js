// src/game/state.js

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

// Inicializa o contexto se o canvas existir
if (gameState.canvas) {
    gameState.ctx = gameState.canvas.getContext("2d");
}

/**
 * Remove objetos mortos de uma lista sem quebrar a referência original.
 * Útil para limpar balas e inimigos.
 */
export function limparListaInPlace(lista) {
    if (!lista) return;
    for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].dead) {
            lista.splice(i, 1);
        }
    }
}

/**
 * Adiciona um número de dano visual ao estado
 */
export const criarNumeroDano = (x, y, val, color) => {
    gameState.damageNumbers.push({ 
        x, 
        y: y - 20, 
        val: Math.floor(val), 
        life: 1.0, 
        color 
    });
};
