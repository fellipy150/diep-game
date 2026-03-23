import { input } from "../../core/input/index.js";

/**
 * Renderiza o jogador e sua interface de status flutuante (World UI).
 * A interface segue a ordem: HP Texto -> Barra HP -> Munição -> Player.
 */
export function drawPlayer(player, ctx, camera) {
    const drawX = player.x - camera.x;
    const drawY = player.y - camera.y;

    // 1. DESENHO DO CORPO DO JOGADOR
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Olho (Direção Visual)
    const eyeDist = player.radius - 10;
    const eyeX = drawX + Math.cos(player.visualRotation) * eyeDist;
    const eyeY = drawY + Math.sin(player.visualRotation) * eyeDist;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. LINHA DE MIRA (Apenas se estiver mirando)
    if (input.isAiming) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        const dirX = input.aim.x || input.lastAim.x;
        const dirY = input.aim.y || input.lastAim.y;
        ctx.lineTo(drawX + dirX * 60, drawY + dirY * 60);
        ctx.stroke();
        ctx.restore();
    }

    // 3. INDICADOR DE TRAVA (Lock-on)
    if (player.lockedTarget && !player.lockedTarget.dead && player.lockOnTimer > 0) {
        const target = player.lockedTarget;
        ctx.save();
        ctx.translate(target.x - camera.x, target.y - camera.y);
        ctx.rotate(performance.now() * 0.003);
        ctx.globalAlpha = Math.min(1, player.lockOnTimer * 2);
        ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, (target.radius || 20) + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    // 4. BARRAS DE STATUS (Acima do Jogador)
    drawWorldUI(player, ctx, drawX, drawY);
}

/**
 * Desenha os elementos de interface que flutuam sobre o personagem.
 */
function drawWorldUI(player, ctx, drawX, drawY) {
    const barWidth = 46;
    const barHeight = 5;
    const spacing = 4;
    
    // Ponto de partida vertical (subindo a partir do topo do player)
    let currentY = drawY - player.radius - 10;

    // --- A. BARRAS DE MUNIÇÃO (Segments) ---
    const weapon = player.inventory ? player.inventory.getActiveWeapon() : null;
    if (weapon && weapon.magSize) {
        const ammoCount = weapon.magSize;
        const ammoSpacing = 1;
        const segmentWidth = (barWidth - (ammoCount - 1) * ammoSpacing) / ammoCount;

        for (let i = 0; i < ammoCount; i++) {
            const segX = (drawX - barWidth / 2) + i * (segmentWidth + ammoSpacing);
            
            // Fundo do slot
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(segX, currentY, segmentWidth, barHeight - 1);

            if (i < weapon.currentAmmo) {
                // Bala disponível
                ctx.fillStyle = "#00ffff";
                ctx.fillRect(segX, currentY, segmentWidth, barHeight - 1);
            } else if (i === Math.floor(weapon.currentAmmo)) {
                // Slot recarregando
                const reloadRatio = (weapon.reloadTimer || 0) / (weapon.reloadTime || 1);
                ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
                ctx.fillRect(segX, currentY, segmentWidth * reloadRatio, barHeight - 1);
            }
        }
        currentY -= (barHeight + spacing);
    }

    // --- B. BARRA DE VIDA (HP) ---
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(drawX - barWidth / 2, currentY, barWidth, barHeight);
    
    // Cor dinâmica: verde se estiver bem, vermelho se estiver morrendo
    ctx.fillStyle = hpRatio > 0.3 ? "#2ecc71" : "#e74c3c";
    ctx.fillRect(drawX - barWidth / 2, currentY, barWidth * hpRatio, barHeight);
    
    currentY -= spacing + 2;

    // --- C. TEXTO DE HP ATUAL ---
    ctx.fillStyle = "white";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    // Exibe apenas o valor arredondado para cima (ex: 340)
    ctx.fillText(Math.ceil(player.hp), drawX, currentY);
}

