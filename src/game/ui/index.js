import { gameState } from "../state.js";

export function desenharGameOver() {
    const { ctx, canvas, player } = gameState;
    if (!ctx || !canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", Math.floor(cx), Math.floor(cy - 20));
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Você alcançou o Nível ${player?.level || 1}`, Math.floor(cx), Math.floor(cy + 30));
    ctx.fillText("Recarregue a página para tentar novamente", Math.floor(cx), Math.floor(cy + 70));
}
function selecionarUpgrade(upgradeId, overlay) {
    if (gameState.player) {
        gameState.player.applyUpgrade(upgradeId);
    }
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    gameState.isPaused = false;
}
