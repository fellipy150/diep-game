// src/game/renderer.js
import { renderHUD } from './ui/HUD/index.js';

// ⚙️ CONFIGURAÇÕES DE CÂMERA
export const CAMERA_CONFIG = {
    BASE_FOV: 750,        // Resolução lógica padrão
    START_FOV: 2500,      // Zoom inicial (efeito de entrada)
    ZOOM_SPEED: 0.04,     // Velocidade da transição de zoom
    LERP_SPEED: 0.15,     // Suavidade do seguimento do player
    SHAKE_DECAY: 0.9      // Amortecimento do tremor
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

// --- 🛠️ AUXILIARES ---

function getLogicalDimensions(canvasWidth, canvasHeight, fov) {
    const scale = canvasWidth / fov;
    return {
        scale: scale,
        width: fov,
        height: canvasHeight / scale
    };
}

// --- 🎥 LÓGICA DE CÂMERA ---

export function resetCamera(player, canvasWidth, canvasHeight) {
    camera.centerX = player.x;
    camera.centerY = player.y;
    camera.currentFOV = CAMERA_CONFIG.START_FOV;
    
    const dim = getLogicalDimensions(canvasWidth, canvasHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
}

export function updateCamera(player, canvasWidth, canvasHeight) {
    // Animação de Zoom
    camera.currentFOV += (CAMERA_CONFIG.BASE_FOV - camera.currentFOV) * CAMERA_CONFIG.ZOOM_SPEED;
    
    // Interpolação do Centro (Foco)
    camera.centerX += (player.x - camera.centerX) * CAMERA_CONFIG.LERP_SPEED;
    camera.centerY += (player.y - camera.centerY) * CAMERA_CONFIG.LERP_SPEED;

    const dim = getLogicalDimensions(canvasWidth, canvasHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);

    // Efeito de Tremor (Screen Shake)
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= CAMERA_CONFIG.SHAKE_DECAY;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}

// --- 🎨 RENDERIZAÇÃO PRINCIPAL ---

export function renderGame(ctx, canvas, gameState) {
    const { player, enemies, hazards, damageNumbers } = gameState;
    const dim = getLogicalDimensions(canvas.width, canvas.height, camera.currentFOV);

    // 1. Limpa o Canvas
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. CAMADA DO MUNDO (Escalada e seguindo a câmera)
    ctx.save();
    ctx.scale(dim.scale, dim.scale);

    desenharGrelha(ctx, dim.width, dim.height);

    if (hazards) hazards.forEach(h => h.draw(ctx, camera));
    
    // Projéteis (abaixo das entidades)
    if (player) player.bullets.forEach(b => b.draw(ctx, camera));
    if (enemies) enemies.forEach(e => e.bullets?.forEach(b => b.draw(ctx, camera)));

    // Entidades
    if (enemies) enemies.forEach(e => !e.dead && e.draw(ctx, camera));
    if (player) player.draw(ctx, camera);

    // Efeitos visuais de mundo (Números de dano)
    if (damageNumbers) renderVFX(ctx, damageNumbers);

    ctx.restore();

    // 3. CAMADA DE HUD (Fixa na tela, sem escala de câmera)
    renderHUD(ctx, canvas, gameState);
}

// --- 📝 FUNÇÕES DE DESENHO INTERNAS ---

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

    // Linhas verticais e horizontais
    ctx.beginPath();
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight);
    }
    for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
        ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y);
    }
    ctx.stroke();

    // Pontos da grelha (Efeito visual)
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
