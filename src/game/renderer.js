export const CAMERA_CONFIG = {
    BASE_FOV: 750,
    START_FOV: 2500,
    ZOOM_SPEED: 0.04,
    LERP_SPEED: 0.15,
    SHAKE_DECAY: 0.9
};
export const BASE_FOV_WIDTH = CAMERA_CONFIG.BASE_FOV;
const TWO_PI = Math.PI * 2;
export const camera = {
    x: 0, y: 0, centerX: 0, centerY: 0, shake: 0, currentFOV: CAMERA_CONFIG.START_FOV
};
let sw = window.innerWidth;
let sh = window.innerHeight;
window.addEventListener('resize', () => {
    sw = window.innerWidth;
    sh = window.innerHeight;
});
const dim = { scale: 1, width: 0, height: 0 };
function updateLogicalDimensions(screenWidth, screenHeight, fov) {
    dim.scale = screenWidth / fov;
    dim.width = fov;
    dim.height = screenHeight / dim.scale;
}
function isVisible(ex, ey, r, cam, logicalWidth, logicalHeight) {
    return !(
        ex + r < cam.x ||
        ex - r > cam.x + logicalWidth ||
        ey + r < cam.y ||
        ey - r > cam.y + logicalHeight
    );
}
export function resetCamera(player) {
    camera.centerX = player.x;
    camera.centerY = player.y;
    camera.currentFOV = CAMERA_CONFIG.START_FOV;
    updateLogicalDimensions(sw, sh, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
}
export function updateCamera(player) {
    camera.currentFOV += (CAMERA_CONFIG.BASE_FOV - camera.currentFOV) * CAMERA_CONFIG.ZOOM_SPEED;
    camera.centerX += (player.x - camera.centerX) * CAMERA_CONFIG.LERP_SPEED;
    camera.centerY += (player.y - camera.centerY) * CAMERA_CONFIG.LERP_SPEED;
    updateLogicalDimensions(sw, sh, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= CAMERA_CONFIG.SHAKE_DECAY;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}
const bulletBatches = Object.create(null);
function renderBatchedBullets(ctx, playerBullets, enemies, cam, dimension) {
    for (const color in bulletBatches) {
        bulletBatches[color].length = 0;
    }
    if (playerBullets) {
        for (let i = 0; i < playerBullets.length; i++) {
            const b = playerBullets[i];
            const r = b.radius || 30;
            if (b.dead || !isVisible(b.x, b.y, r, cam, dimension.width, dimension.height)) continue;
            if (!bulletBatches[b.color]) bulletBatches[b.color] = [];
            bulletBatches[b.color].push(b);
        }
    }
    if (enemies) {
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.bullets) continue;
            for (let j = 0; j < e.bullets.length; j++) {
                const b = e.bullets[j];
                const r = b.radius || 30;
                if (b.dead || !isVisible(b.x, b.y, r, cam, dimension.width, dimension.height)) continue;
                if (!bulletBatches[b.color]) bulletBatches[b.color] = [];
                bulletBatches[b.color].push(b);
            }
        }
    }
    for (const color in bulletBatches) {
        const group = bulletBatches[color];
        if (group.length === 0) continue;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < group.length; i++) {
            const b = group[i];
            const drawX = b.x - cam.x;
            const drawY = b.y - cam.y;
            ctx.moveTo(drawX + b.radius, drawY);
            ctx.arc(drawX, drawY, b.radius, 0, TWO_PI);
        }
        ctx.fill();
    }
}
const vfxBatches = Object.create(null);
function renderVFX(ctx, damageNumbers, logicalWidth, logicalHeight) {
    if (!damageNumbers || damageNumbers.length === 0) return;
    for (const color in vfxBatches) {
        for (let a = 1; a <= 10; a++) {
            if (vfxBatches[color][a]) vfxBatches[color][a].length = 0;
        }
    }
    for (let i = 0; i < damageNumbers.length; i++) {
        const n = damageNumbers[i];
        if (!isVisible(n.x, n.y, 20, camera, logicalWidth, logicalHeight)) continue;
        const alphaLevel = Math.ceil(n.life * 10);
        if (alphaLevel <= 0) continue;
        if (!vfxBatches[n.color]) {
            vfxBatches[n.color] = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[], 10:[] };
        }
        const safeAlpha = alphaLevel > 10 ? 10 : alphaLevel;
        vfxBatches[n.color][safeAlpha].push(n);
    }
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    for (const color in vfxBatches) {
        ctx.fillStyle = color;
        const alphaGroups = vfxBatches[color];
        for (let a = 10; a > 0; a--) {
            const group = alphaGroups[a];
            if (!group || group.length === 0) continue;
            ctx.globalAlpha = a / 10;
            for (let i = 0; i < group.length; i++) {
                const n = group[i];
                ctx.fillText(~~n.val, ~~(n.x - camera.x), ~~(n.y - camera.y));
            }
        }
    }
    ctx.globalAlpha = 1.0;
}
let cachedGridPattern = null;
function desenharGrelhaOtimizada(ctx, logicalWidth, logicalHeight) {
    const cellSize = 50;
    if (!cachedGridPattern) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = cellSize;
        offCanvas.height = cellSize;
        const offCtx = offCanvas.getContext('2d');
        offCtx.strokeStyle = "rgba(0, 255, 255, 0.08)";
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.moveTo(0, cellSize); offCtx.lineTo(cellSize, cellSize);
        offCtx.moveTo(cellSize, 0); offCtx.lineTo(cellSize, cellSize);
        offCtx.stroke();
        offCtx.fillStyle = "rgba(0, 255, 255, 0.2)";
        offCtx.beginPath();
        offCtx.arc(cellSize, cellSize, 1.5, 0, TWO_PI);
        offCtx.fill();
        cachedGridPattern = ctx.createPattern(offCanvas, 'repeat');
    }
    const offsetX = camera.x % cellSize;
    const offsetY = camera.y % cellSize;
    ctx.save();
    ctx.translate(-offsetX, -offsetY);
    ctx.fillStyle = cachedGridPattern;
    ctx.fillRect(0, 0, logicalWidth + cellSize, logicalHeight + cellSize);
    ctx.restore();
}
export function renderGame(ctx, canvas, gameState) {
    const { player, enemies, hazards, damageNumbers } = gameState;
    updateLogicalDimensions(sw, sh, camera.currentFOV);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, sw, sh);
    ctx.save();
    ctx.scale(dim.scale, dim.scale);
    desenharGrelhaOtimizada(ctx, dim.width, dim.height);
    if (hazards) {
        for (let i = 0; i < hazards.length; i++) {
            const h = hazards[i];
            const r = h.radius || 30;
            if (isVisible(h.x, h.y, r, camera, dim.width, dim.height)) h.draw(ctx, camera);
        }
    }
    renderBatchedBullets(ctx, player?.bullets, enemies, camera, dim);
    if (enemies) {
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const r = e.radius || 30;
            if (!e.dead && isVisible(e.x, e.y, r, camera, dim.width, dim.height)) e.draw(ctx, camera);
        }
    }
    if (player) player.draw(ctx, camera);
    if (damageNumbers) renderVFX(ctx, damageNumbers, dim.width, dim.height);
    ctx.restore();
}
