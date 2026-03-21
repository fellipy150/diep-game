import { renderHUD } from './ui/HUD/index.js';

// ⚙️ CONFIGURAÇÕES DE CÂMERA
export const CAMERA_CONFIG = {
    BASE_FOV: 750,
    START_FOV: 2500,
    ZOOM_SPEED: 0.04,
    LERP_SPEED: 0.15,
    SHAKE_DECAY: 0.9
};

export const BASE_FOV_WIDTH = CAMERA_CONFIG.BASE_FOV;

export const camera = {
    x: 0, y: 0, centerX: 0, centerY: 0, shake: 0, currentFOV: CAMERA_CONFIG.START_FOV
};

// --- 🛠️ AUXILIARES ---

function getLogicalDimensions(screenWidth, screenHeight, fov) {
    const scale = screenWidth / fov;
    return { scale: scale, width: fov, height: screenHeight / scale };
}

// ✂️ FASE 1: LÓGICA DE CULLING (Descarte Espacial)
function isVisible(entity, camera, logicalWidth, logicalHeight) {
    // Define uma margem de segurança (raio da entidade ou padrão 30px)
    const r = entity.radius || 30; 
    
    // Se a entidade estiver fora do retângulo da câmera, retorna false
    return !(
        entity.x + r < camera.x || 
        entity.x - r > camera.x + logicalWidth || 
        entity.y + r < camera.y || 
        entity.y - r > camera.y + logicalHeight
    );
}

// --- 🎥 LÓGICA DE CÂMERA ---

export function resetCamera(player) {
    camera.centerX = player.x;
    camera.centerY = player.y;
    camera.currentFOV = CAMERA_CONFIG.START_FOV;
    
    const dim = getLogicalDimensions(window.innerWidth, window.innerHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);
}

export function updateCamera(player) {
    camera.currentFOV += (CAMERA_CONFIG.BASE_FOV - camera.currentFOV) * CAMERA_CONFIG.ZOOM_SPEED;
    camera.centerX += (player.x - camera.centerX) * CAMERA_CONFIG.LERP_SPEED;
    camera.centerY += (player.y - camera.centerY) * CAMERA_CONFIG.LERP_SPEED;

    const dim = getLogicalDimensions(window.innerWidth, window.innerHeight, camera.currentFOV);
    camera.x = camera.centerX - (dim.width / 2);
    camera.y = camera.centerY - (dim.height / 2);

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
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dim = getLogicalDimensions(screenWidth, screenHeight, camera.currentFOV);

    // 1. Limpa o Canvas
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. CAMADA DO MUNDO
    ctx.save();
    ctx.scale(dim.scale, dim.scale);

    // 🖼️ FASE 2: Grelha Pre-renderizada (Extremamente rápido)
    desenharGrelhaOtimizada(ctx, dim.width, dim.height);

    // ✂️ FASE 1: Renderização com Culling aplicado a tudo
    if (hazards) {
        hazards.forEach(h => {
            if (isVisible(h, camera, dim.width, dim.height)) h.draw(ctx, camera);
        });
    }
    
    // Projéteis do Player
    if (player) {
        player.bullets.forEach(b => {
            if (isVisible(b, camera, dim.width, dim.height)) b.draw(ctx, camera);
        });
    }

    // Inimigos e Projéteis dos Inimigos
    if (enemies) {
        enemies.forEach(e => {
            if (e.bullets) {
                e.bullets.forEach(b => {
                    if (isVisible(b, camera, dim.width, dim.height)) b.draw(ctx, camera);
                });
            }
            if (!e.dead && isVisible(e, camera, dim.width, dim.height)) {
                e.draw(ctx, camera);
            }
        });
    }

    // O Player sempre será desenhado (pois a câmera está nele)
    if (player) player.draw(ctx, camera);

    if (damageNumbers) renderVFX(ctx, damageNumbers, dim.width, dim.height);

    ctx.restore();

    // 3. CAMADA DE HUD
    renderHUD(ctx, canvas, gameState);
}

// --- 📝 FUNÇÕES DE DESENHO INTERNAS ---

function renderVFX(ctx, damageNumbers, logicalWidth, logicalHeight) {
    for (const n of damageNumbers) {
        // Culling para os números de dano também!
        if (!isVisible({ x: n.x, y: n.y, radius: 20 }, camera, logicalWidth, logicalHeight)) continue;

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

// 🖼️ FASE 2: CACHE DA GRELHA EM MEMÓRIA (Offscreen Canvas)
let cachedGridPattern = null;

function desenharGrelhaOtimizada(ctx, logicalWidth, logicalHeight) {
    const tamanhoCelula = 50;

    // Gera a imagem do bloco da grelha apenas UMA VEZ na vida útil do jogo
    if (!cachedGridPattern) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = tamanhoCelula;
        offCanvas.height = tamanhoCelula;
        const offCtx = offCanvas.getContext('2d');

        // Desenha as bordas da célula
        offCtx.strokeStyle = "rgba(0, 255, 255, 0.08)";
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.moveTo(0, tamanhoCelula); offCtx.lineTo(tamanhoCelula, tamanhoCelula); // Linha Inferior
        offCtx.moveTo(tamanhoCelula, 0); offCtx.lineTo(tamanhoCelula, tamanhoCelula); // Linha Direita
        offCtx.stroke();

        // Desenha o pontinho da interseção
        offCtx.fillStyle = "rgba(0, 255, 255, 0.2)";
        offCtx.beginPath();
        offCtx.arc(tamanhoCelula, tamanhoCelula, 1.5, 0, Math.PI * 2);
        offCtx.fill();

        cachedGridPattern = ctx.createPattern(offCanvas, 'repeat');
    }

    // O deslocamento da textura baseado no movimento da câmera
    const offsetX = camera.x % tamanhoCelula;
    const offsetY = camera.y % tamanhoCelula;

    ctx.save();
    // Translada para criar a ilusão de movimento
    ctx.translate(-offsetX, -offsetY);
    ctx.fillStyle = cachedGridPattern;
    
    // Desenha um único retângulo gigante cobrindo a tela toda usando a textura em repetição
    // Adicionamos tamanhoCelula extra para cobrir as bordas durante a translação
    ctx.fillRect(0, 0, logicalWidth + tamanhoCelula, logicalHeight + tamanhoCelula);
    
    ctx.restore();
}
