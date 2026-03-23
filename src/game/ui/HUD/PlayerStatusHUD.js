export function drawPlayerStatus(ctx, player, _canvas) {
    const startX = 20;
    const startY = 30;
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Level  ${Math.floor(player.level)}`, Math.floor(startX), Math.floor(startY));
    const xpRatio = Math.max(0, player.xp / player.xpNeeded);
    const barWidth = 200;
    const barHeight = 12;
    ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
    ctx.fillRect(startX, startY + 10, barWidth, barHeight);
    ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
    ctx.fillRect(startX, startY + 10, barWidth * xpRatio, barHeight);
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.floor(player.xp)} /  ${Math.floor(player.xpNeeded)} XP`, Math.floor(startX + (barWidth / 2)), Math.floor(startY + 20));
}
