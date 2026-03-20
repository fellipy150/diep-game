// src/game/renderer.js
export const CAMERA_CONFIG = {
    BASE_FOV: 750,
    START_FOV: 2500,
    ZOOM_SPEED: 0.04,
    LERP_SPEED: 0.15,
    SHAKE_DECAY: 0.9
};
export const BASE_FOV_WIDTH = CAMERA_CONFIG.BASE_FOV;
export const camera = {
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
    shake: 0,
    currentFOV: CAMERA_CONFIG.START_FOV
};
function getLogicalDimensions(canvasWidth, canvasHeight, fov) {
    const scale = canvasWidth / fov;
    return {
        scale: scale,
        width: fov,
        height: canvasHeight / scale
    };
}
export function resetCamera(player, canvasWidth, canvasHeight) {
    camera.centerX = player.x;
    camera.centerY = player.y;
    camera.currentFOV = CAMERA_CONFIG.START_FOV;
    const dim = getLogicalDimensions(canvasWidth, canvasHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
}
export function updateCamera(player, canvasWidth, canvasHeight) {
    camera.currentFOV += (CAMERA_CONFIG.BASE_FOV - camera.currentFOV) * CAMERA_CONFIG.ZOOM_SPEED;
    camera.centerX += (player.x - camera.centerX) * CAMERA_CONFIG.LERP_SPEED;
    camera.centerY += (player.y - camera.centerY) * CAMERA_CONFIG.LERP_SPEED;
    const dim = getLogicalDimensions(canvasWidth, canvasHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
    if (camera.shake > 0) {
        const sx = (Math.random() - 0.5) * camera.shake;
        const sy = (Math.random() - 0.5) * camera.shake;
        camera.x += sx;
        camera.y += sy;
        camera.shake *= CAMERA_CONFIG.SHAKE_DECAY;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}
export function renderGame(ctx, canvas, gameState) {
    const { player, enemies, hazards, damageNumbers } = gameState;
    const dim = getLogicalDimensions(canvas.width, canvas.height, camera.currentFOV);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dim.scale, dim.scale);
    desenharGrelha(ctx, dim.width, dim.height);
    if (hazards) hazards.forEach(h => h.draw(ctx, camera));
    if (player) player.bullets.forEach(b => b.draw(ctx, camera));
    if (enemies) enemies.forEach(e => e.bullets?.forEach(b => b.draw(ctx, camera)));
    if (enemies) enemies.forEach(e => !e.dead && e.draw(ctx, camera));
    if (player) player.draw(ctx, camera);
    if (damageNumbers) renderVFX(ctx, damageNumbers);
    ctx.restore();
}
function renderVFX(ctx, damageNumbers) {
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
