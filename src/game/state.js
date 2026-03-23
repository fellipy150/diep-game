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
if (gameState.canvas) {
    gameState.ctx = gameState.canvas.getContext("2d");
}
export function fastRemove(array, index) {
    const lastIndex = array.length - 1;
    if (index !== lastIndex) {
        array[index] = array[lastIndex];
    }
    array.pop();
}
export function limparListaInPlace(lista) {
    if (!lista) return;
    for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].dead) {
            fastRemove(lista, i);
        }
    }
}
export function criarNumeroDano(x, y, val, color) {
    if (gameState.damageNumbers.length > 25) {
        gameState.damageNumbers.shift();
    }
    gameState.damageNumbers.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 10,
        val: Math.floor(val),
        color: color,
        life: 1.0
    });
}
