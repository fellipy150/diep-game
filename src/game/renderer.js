export const camera = { x: 0, y: 0, shake: 0 };
export const BASE_FOV_WIDTH = 750;
export function updateCamera(player, canvasWidth, canvasHeight) {
    const scale = canvasWidth / BASE_FOV_WIDTH;
    const logicalWidth = BASE_FOV_WIDTH;
    const logicalHeight = canvasHeight / scale;
    let targetX = player.x;
    let targetY = player.y;
    const activeDrone = player.bullets.find(b => b.type === 'drone' && !b.dead);
    if (activeDrone) {
        targetX = activeDrone.x;
        targetY = activeDrone.y;
    }
    const desiredX = targetX - (logicalWidth / 2);
    const desiredY = targetY - (logicalHeight / 2);
    camera.x += (desiredX - camera.x) * 0.1;
    camera.y += (desiredY - camera.y) * 0.1;
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= 0.9;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}
export function renderGame(ctx, canvas, player, enemies, hazards, damageNumbers = []) {
    const scale = canvas.width / BASE_FOV_WIDTH;
    const logicalWidth = BASE_FOV_WIDTH;
    const logicalHeight = canvas.height / scale;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    desenharGrelha(ctx, logicalWidth, logicalHeight);
    if (hazards) {
        for (const h of hazards) {
            h.draw(ctx, camera);
        }
    }
    player.draw(ctx, camera);
    if (enemies) {
        for (const e of enemies) {
            if (!e.dead) {
                e.draw(ctx, camera, player);
            }
        }
    }
    for (const n of damageNumbers) {
        const drawX = n.x - camera.x;
        const drawY = n.y - camera.y;
        ctx.fillStyle = n.color;
        const fontSize = Math.max(12, 20 * n.life);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.globalAlpha = Math.max(0, n.life);
        ctx.fillText(n.val, drawX, drawY);
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();
}
function desenharGrelha(ctx, logicalWidth, logicalHeight) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    const tamanhoCelula = 50;
    const offsetX = Math.floor(camera.x) % tamanhoCelula;
    const offsetY = Math.floor(camera.y) % tamanhoCelula;
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
    }
    for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
    }
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
