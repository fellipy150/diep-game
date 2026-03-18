export const camera = { x: 0, y: 0, shake: 0 };

// 🔴 RESOLUÇÃO LÓGICA: Define que o jogo sempre "acha" que tem 1000 unidades de largura.
// Isso impede que o zoom do navegador ou o tamanho da tela alterem o campo de visão.
const BASE_FOV_WIDTH = 750;

/**
 * Atualiza a posição da câmera com base no jogador ou drones ativos.
 */
export function updateCamera(player, canvasWidth, canvasHeight) {
    // Calculamos a escala e as dimensões lógicas (proporcionais)
    const scale = canvasWidth / BASE_FOV_WIDTH;
    const logicalWidth = BASE_FOV_WIDTH;
    const logicalHeight = canvasHeight / scale;

    let targetX = player.x;
    let targetY = player.y;

    // Lógica do Código 1: Seguir o drone se estiver ativo
    const activeDrone = player.bullets.find(b => b.type === 'drone' && !b.dead);
    if (activeDrone) {
        targetX = activeDrone.x;
        targetY = activeDrone.y;
    }

    // Centraliza a câmera no alvo usando unidades lógicas
    const desiredX = targetX - (logicalWidth / 2);
    const desiredY = targetY - (logicalHeight / 2);

    // Suavização (Interpolação)
    camera.x += (desiredX - camera.x) * 0.1;
    camera.y += (desiredY - camera.y) * 0.1;

    // Efeito de tremor (Shake)
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= 0.9;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}

/**
 * Renderiza todos os elementos do jogo aplicando a escala de zoom fixo.
 */
export function renderGame(ctx, canvas, player, enemies, hazards, damageNumbers = []) {
    // Cálculo da escala para ignorar o zoom do navegador
    const scale = canvas.width / BASE_FOV_WIDTH;
    const logicalWidth = BASE_FOV_WIDTH;
    const logicalHeight = canvas.height / scale;

    // 1. Limpa o fundo (usando resolução física total)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Aplica a escala lógica
    ctx.save();
    ctx.scale(scale, scale);

    // 3. Desenha os elementos (todos agora usam coordenadas lógicas)
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

    // Números de dano
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

    ctx.restore(); // Restaura o estado para o próximo frame
}

/**
 * Desenha a grelha de fundo adaptada às dimensões lógicas.
 */
function desenharGrelha(ctx, logicalWidth, logicalHeight) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    const tamanhoCelula = 50;

    // O deslocamento (offset) faz a grelha parecer infinita enquanto a câmera move
    const offsetX = Math.floor(camera.x) % tamanhoCelula;
    const offsetY = Math.floor(camera.y) % tamanhoCelula;

    // Linhas verticais
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
    }
    // Linhas horizontais
    for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
    }

    // Pontos de interseção para detalhe visual
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    for (let x = -offsetX; x < logicalWidth; x += tamanhoCelula) {
        for (let y = -offsetY; y < logicalHeight; y += tamanhoCelula) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
