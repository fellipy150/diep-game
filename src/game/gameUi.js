import { gameState } from "./state.js";
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
    ctx.fillText("GAME OVER", cx, cy - 20);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Você alcançou o Nível ${player?.level || 1}`, cx, cy + 30);
    ctx.fillText("Recarregue a página para tentar novamente", cx, cy + 70);
}
export function mostrarMenuLevelUp(choices) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '100',
        color: 'white',
        fontFamily: 'sans-serif'
    });
    const titulo = document.createElement('h1');
    titulo.innerText = `Nível ${gameState.player.level}! Escolha um Upgrade:`;
    titulo.style.marginBottom = '20px';
    overlay.appendChild(titulo);
    choices.forEach(upgrade => {
        const btn = document.createElement('button');
        Object.assign(btn.style, {
            margin: '8px',
            padding: '12px',
            backgroundColor: '#111',
            color: '#0ff',
            border: '1px solid #0ff',
            borderRadius: '4px',
            width: '300px',
            cursor: 'pointer',
            textAlign: 'left'
        });
        btn.innerHTML = `<strong>${upgrade.name}</strong><br><small style="color:#aaa">${upgrade.description}</small>`;
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            selecionarUpgrade(upgrade.id, overlay);
        });
        overlay.appendChild(btn);
    });
    document.body.appendChild(overlay);
}
function selecionarUpgrade(upgradeId, overlay) {
    if (gameState.player) {
        gameState.player.applyUpgrade(upgradeId);
    }
    if (overlay?.parentNode) {
        document.body.removeChild(overlay);
    }
    gameState.isPaused = false;
}
