import { input } from "../../core/input/index.js";

export function drawPlayer(player, ctx, camera) {
    const drawX = player.x - camera.x;
    const drawY = player.y - camera.y;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius - 3, 0, Math.PI * 2);
    ctx.fill();
    const eyeDist = player.radius - 10;
    const eyeX = drawX + Math.cos(player.visualRotation) * eyeDist;
    const eyeY = drawY + Math.sin(player.visualRotation) * eyeDist;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    if (input.isAiming) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 0]);
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        // IMPORTANTE: Se input.aim.x/y estiverem zerados, a linha não aparece.
        const dirX = input.aim.x || input.lastAim.x;
        const dirY = input.aim.y || input.lastAim.y;
        ctx.lineTo(drawX + dirX * 60, drawY + dirY * 60);
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
        ctx.globalAlpha = Math.min(1, player.lockOnTimer * 2);
        ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        const aimRadius = (target.radius || 20) + 10;
        ctx.arc(0, 0, aimRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1.0;
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
    const textY = drawY - 48;
    const hpY = drawY - 42;
    const ammoY = drawY - 32;
    // 1. Texto de HP Atual (Ex: 150 / 200)
    ctx.fillStyle = "white";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(player.hp)} / ${Math.floor(player.maxHp)}`, Math.floor(drawX), Math.floor(textY));
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    ctx.fillRect(drawX - 25, hpY, 50, 6);
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.fillRect(drawX - 25, hpY, 50 * hpRatio, 6);
    const weapon = player.loadout ? player.loadout.getActiveWeapon() : null;
    if (weapon && weapon.maxSlots) {
        const totalWidth = 50;
        const slotWidth = (totalWidth - (weapon.maxSlots - 1)) / weapon.maxSlots;
        let startX = drawX - 25;
        for (let i = 0; i < weapon.maxSlots; i++) {
            ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
            ctx.fillRect(startX, ammoY, slotWidth, 4);
            if (i < weapon.currentAmmo) {
                ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
                ctx.fillRect(startX, ammoY, slotWidth, 4);
            } else if (i === weapon.currentAmmo) {
                const reloadRatio = (weapon.reloadTimer || 0) / (weapon.reloadTime || 1);
                ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
                ctx.fillRect(startX, ammoY, slotWidth * reloadRatio, 4);
            }
            startX += slotWidth + 1;
        }
    }
}
