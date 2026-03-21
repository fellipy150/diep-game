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
export function mostrarMenuLevelUp(choices) {
    if (document.getElementById('level-up-overlay')) return;
    console.log("✨ Menu de Level Up aberto:", choices);
    if (!choices || choices.length === 0) {
        console.warn("⚠️ Nenhuma escolha disponível. Despausando jogo.");
        gameState.isPaused = false;
        return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'level-up-overlay';
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
    const fragmento = document.createDocumentFragment();
    const titulo = document.createElement('h1');
    titulo.innerText = `Nível ${gameState.player.level}! Escolha um Upgrade:`;
    titulo.style.marginBottom = '20px';
    fragmento.appendChild(titulo);
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
            textAlign: 'left',
            transition: 'background-color 0.2s'
        });
        btn.onmouseenter = () => btn.style.backgroundColor = '#222';
        btn.onmouseleave = () => btn.style.backgroundColor = '#111';
        btn.innerHTML = `<strong>${upgrade.name}</strong><br><small style="color:#aaa">${upgrade.description}</small>`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selecionarUpgrade(upgrade.id, overlay);
        });
        fragmento.appendChild(btn);
    });
    overlay.appendChild(fragmento);
    document.body.appendChild(overlay);
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
