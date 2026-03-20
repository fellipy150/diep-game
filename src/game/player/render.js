import { input } from "../../core/input.js";

export function drawPlayer(player, ctx, camera) {
    const drawX = player.x - camera.x;
    const drawY = player.y - camera.y;
    // --- 1. EFEITOS DE FUNDO (Aura/Gradiente) ---
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
    if (input.isAiming) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX + input.aim.x * 60, drawY + input.aim.y * 60);
        ctx.stroke();
        ctx.restore();
    }
    if (player.lockedTarget && !player.lockedTarget.dead && player.lockOnTimer > 0) {
        const target = player.lockedTarget;
        const targetDrawX = target.x - camera.x;
        const targetDrawY = target.y - camera.y;
        ctx.save();
        ctx.translate(targetDrawX, targetDrawY);
        ctx.rotate(performance.now() * 0.003);
        ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        const aimRadius = (target.radius || 20) + 10;
        ctx.arc(0, 0, aimRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    if (player.activeSynergies && player.activeSynergies.size > 0) {
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
    const weapon = player.weapon;
    if (weapon && weapon.maxSlots) {
        const totalWidth = 50;
        const slotWidth = (totalWidth - (weapon.maxSlots - 1)) / weapon.maxSlots;
        let startX = drawX - 25;
        for (let i = 0; i < weapon.maxSlots; i++) {
            ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
            ctx.fillRect(startX, drawY + 20, slotWidth, 4);
            if (i < weapon.currentAmmo) {
                ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
                ctx.fillRect(startX, drawY + 20, slotWidth, 4);
            } else if (i === weapon.currentAmmo) {
                const reloadRatio = (weapon.reloadTimer || 0) / (weapon.reloadTime || 1);
                ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
                ctx.fillRect(startX, drawY + 20, slotWidth * reloadRatio, 4);
            }
            startX += slotWidth + 1;
        }
    }
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Lvl ${player.level}`, drawX, drawY + 54);
}
