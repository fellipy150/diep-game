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
export function limparListaInPlace(lista) {
    if (!lista) return;
    for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].dead) {
            lista.splice(i, 1);
        }
    }
}
export const criarNumeroDano = (x, y, val, color) => {
    gameState.damageNumbers.push({
        x,
        y: y - 20,
        val: Math.floor(val),
        life: 1.0,
        color
    });
};
