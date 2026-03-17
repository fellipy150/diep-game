import { input } from "../../core/input.js";
export function drawPlayer(player, ctx, camera) {
    const drawX = player.x - camera.x;
    const drawY = player.y - camera.y;
    for (const b of player.bullets) {
        b.draw(ctx, camera, { x: player.x, y: player.y });
    }
    const grad = ctx.createRadialGradient(drawX, drawY, player.radius - 10, drawX, drawY, player.radius + 15);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "cyan");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius + 5, player.visualRotation, player.visualRotation + Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius - 5, 0, Math.PI * 2);
    ctx.fill();
    if (input.aim.x !== 0 || input.aim.y !== 0) {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX + input.aim.x * 35, drawY + input.aim.y * 35);
        ctx.stroke();
    }
    if (player.activeSynergies.length > 0) {
        ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, player.radius + 13, 0, Math.PI * 2);
        ctx.stroke();
    }
    drawBars(player, ctx, drawX, drawY);
}
function drawBars(player, ctx, drawX, drawY) {
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    ctx.fillRect(drawX - 25, drawY + 30, 50, 6);
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.fillRect(drawX - 25, drawY + 30, 50 * hpRatio, 6);
    const xpRatio = Math.max(0, player.xp / player.xpNeeded);
    ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
    ctx.fillRect(drawX - 25, drawY + 40, 50, 4);
    ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
    ctx.fillRect(drawX - 25, drawY + 40, 50 * xpRatio, 4);
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Lvl ${player.level}`, drawX, drawY + 54);
}
