export function drawSwapButton(ctx, player, canvas) {
    const loadout = player.loadout;
    const x = canvas.width - 120;
    const y = canvas.height - 200;
    const radius = 30;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fill();
    ctx.strokeStyle = loadout.swapTimer > 0 ? "#555" : "#00ffff";
    ctx.stroke();
    const nextWeapon = loadout.getNextWeaponPreview();
    if (nextWeapon) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("🔁", x - 10, y + 5);
    }
    if (loadout.swapTimer > 0) {
        const angle = (loadout.swapTimer / loadout.swapCooldown) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, -Math.PI/2, angle - Math.PI/2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();
    }
}
