export function drawWeaponSlots(ctx, player, canvas) {
    const loadout = player.loadout;
    const slotWidth = 60;
    const spacing = 10;
    const totalWidth = (slotWidth + spacing) * loadout.slots;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = canvas.height - 80;
    for (let i = 0; i < loadout.slots; i++) {
        const entry = loadout.weapons[i];
        const isActive = i === loadout.activeIndex;
        ctx.fillStyle = isActive ? "rgba(0, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.5)";
        ctx.strokeStyle = isActive ? "#00ffff" : "#444";
        ctx.lineWidth = isActive ? 3 : 1;
        const x = startX + (i * (slotWidth + spacing));
        ctx.fillRect(x, startY, slotWidth, slotWidth);
        ctx.strokeRect(x, startY, slotWidth, slotWidth);
        if (entry) {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(entry.weapon.name, Math.floor(x + slotWidth/2), Math.floor(startY + slotWidth/2));
            ctx.font = "10px sans-serif";
            ctx.fillText(`(${entry.slotCost})`, Math.floor(x + slotWidth - 10), Math.floor(startY + slotWidth - 5));
        }
    }
}
