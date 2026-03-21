import { input } from "../../core/input/index.js";

/**
 * Renderiza o jogador e seus overlays de combate (Mira, Lock-on, Sinergias).
 */
export function drawPlayer(player, ctx, camera) {
    const drawX = player.x - camera.x;
    const drawY = player.y - camera.y;

    // --- 1. EFEITOS DE FUNDO ---
    // (Aura removida para limpeza visual do campo de batalha)

  // --- 2. CORPO DO PLAYER (Versão Clean) ---
    // Removemos o arco externo ("segunda aura")
    
    // Desenha o corpo principal (Círculo branco)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(drawX, drawY, player.radius - 5, 0, Math.PI * 2);
    ctx.fill();

    // Pequeno detalhe tático: Um ponto ciano na "frente" do boneco
    // para você saber para onde ele está virado sem precisar de aura.
    const frontX = drawX + Math.cos(player.visualRotation) * (player.radius - 8);
    const frontY = drawY + Math.sin(player.visualRotation) * (player.radius - 8);
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(frontX, frontY, 3, 0, Math.PI * 2);
    ctx.fill();

    // --- 3. LASER DE MIRA (Correção) ---
    // Se a mira manual não estiver aparecendo, remova temporariamente 
    // o 'input.isManualAiming' para testar se é um erro de flag.
    if (input.isAiming) { 
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.6)"; // Um pouco mais visível
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Tracejado
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        
        // IMPORTANTE: Se input.aim.x/y estiverem zerados, a linha não aparece.
        // Usamos input.lastAim como fallback de direção se necessário.
        const dirX = input.aim.x || input.lastAim.x;
        const dirY = input.aim.y || input.lastAim.y;
        
        ctx.lineTo(drawX + dirX * 100, drawY + dirY * 100); // Aumentamos o comprimento para 100
        ctx.stroke();
        ctx.restore();
    }


    // --- 4. RENDER DO LOCK-ON GENÉRICO (Mira Automática) ---
    if (player.lockedTarget && !player.lockedTarget.dead && player.lockOnTimer > 0) {
        const target = player.lockedTarget;
        const targetDrawX = target.x - camera.x;
        const targetDrawY = target.y - camera.y;

        ctx.save();
        ctx.translate(targetDrawX, targetDrawY);
        ctx.rotate(performance.now() * 0.003); 
        
        // Efeito de fade-out baseado no timer restante
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

    // --- 5. EFEITOS DE SINERGIA ---
    if (player.activeSynergies && player.activeSynergies.size > 0) {
        ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, player.radius + 13, 0, Math.PI * 2);
        ctx.stroke();
    }

    // --- 6. INTERFACE SOBRE O PLAYER (Vida e Munição) ---
    drawBars(player, ctx, drawX, drawY);
}

/**
 * Desenha os medidores de sobrevivência e combate acima da cabeça do jogador.
 */
function drawBars(player, ctx, drawX, drawY) {
    // Coordenadas negativas para posicionamento acima do player
    const textY = drawY - 48;
    const hpY = drawY - 42;
    const ammoY = drawY - 32;

    // 1. Texto de HP Atual (Ex: 150 / 200)
    ctx.fillStyle = "white";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, drawX, textY);

    // 2. Barra de Vida (Fundo Vermelho, Frente Verde)
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    ctx.fillRect(drawX - 25, hpY, 50, 6);
    ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
    ctx.fillRect(drawX - 25, hpY, 50 * hpRatio, 6);

    // 3. Slots de Munição (Interface de carga da arma ativa)
    const weapon = player.loadout ? player.loadout.getActiveWeapon() : null;
    if (weapon && weapon.maxSlots) {
        const totalWidth = 50;
        const slotWidth = (totalWidth - (weapon.maxSlots - 1)) / weapon.maxSlots;
        let startX = drawX - 25;

        for (let i = 0; i < weapon.maxSlots; i++) {
            // Background do Slot
            ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
            ctx.fillRect(startX, ammoY, slotWidth, 4);

            if (i < weapon.currentAmmo) {
                // Slot com bala pronta (Ciano)
                ctx.fillStyle = "rgba(0, 255, 255, 0.9)"; 
                ctx.fillRect(startX, ammoY, slotWidth, 4);
            } else if (i === weapon.currentAmmo) {
                // Animação visual da recarga do slot atual
                const reloadRatio = (weapon.reloadTimer || 0) / (weapon.reloadTime || 1);
                ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
                ctx.fillRect(startX, ammoY, slotWidth * reloadRatio, 4);
            }
            startX += slotWidth + 1;
        }
    }
}

