export function drawPlayerStatus(ctx, player, canvas) {
    const startX = 20;
    const startY = 30; // Canto superior esquerdo

    // 1. Texto do Level
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Level ${player.level}`, startX, startY);

    // 2. Barra de XP (Esticada e mais grossa)
    const xpRatio = Math.max(0, player.xp / player.xpNeeded);
    const barWidth = 200; // Bem maior para caber na HUD
    const barHeight = 12;

    // Fundo da barra
    ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
    ctx.fillRect(startX, startY + 10, barWidth, barHeight);
    
    // Preenchimento de XP
    ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
    ctx.fillRect(startX, startY + 10, barWidth * xpRatio, barHeight);
    
    // Texto de feedback exato dentro da barra (Opcional, mas fica estiloso)
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.floor(player.xp)} / ${player.xpNeeded} XP`, startX + (barWidth / 2), startY + 20);
}
