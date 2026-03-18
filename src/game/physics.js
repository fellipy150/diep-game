import { gameState, criarNumeroDano } from "./state.js";
import { camera } from "./renderer.js";
import { MeleeAction } from "./enemy/actions/meleeAction.js";
import { gameData } from "../config/configManager.js";

export const verificarColisao = (o1, o2) => {
    const dx = o1.x - o2.x;
    const dy = o1.y - o2.y;
    const rSum = (o1.radius || 10) + (o2.radius || 10);
    return (dx * dx + dy * dy) < (rSum * rSum);
};

export function resolverSobreposicao(o1, o2, dx, dy, distSq, minDist) {
    const dist = Math.sqrt(distSq);
    if (dist === 0) return;
    const overlap = (minDist - dist) / 2;
    const nx = dx / dist;
    const ny = dy / dist;
    o1.x += nx * overlap;
    o1.y += ny * overlap;
    o2.x -= nx * overlap;
    o2.y -= ny * overlap;
}

export const aplicarEfeitoDeStatus = (entidade, tipo, duracao = 2.0) => {
    if (tipo === 'cola' || tipo === 'glue' || tipo === 'stun') {
        if (typeof entidade.addStatusEffect === 'function') {
            entidade.addStatusEffect(tipo, duracao);
        } else {
            entidade.speedMultiplicador = (tipo === 'stun') ? 0 : 0.3;
            entidade.efeitoColaTimer = duracao;
        }
    }
};

export function processarColisoes() {
    const { player, enemies, hazards } = gameState;
    if (!player) return;

    for (let i = 0; i < enemies.length; i++) {
        const e1 = enemies[i];
        if (e1.dead) continue;

        // --- COLISÃO: PLAYER E INIMIGO ---
        const dxP = player.x - e1.x;
        const dyP = player.y - e1.y;
        const distSqP = dxP * dxP + dyP * dyP;
        const minDistP = player.radius + e1.radius;

        if (distSqP < minDistP * minDistP) {
            resolverSobreposicao(player, e1, dxP, dyP, distSqP, minDistP);
            MeleeAction.execute(e1, player, criarNumeroDano);

            const tempoAtual = performance.now();
            const cooldownDano = 500;


if (!e1.ultimoDanoContato || tempoAtual - e1.ultimoDanoContato > cooldownDano) {
                    const bodyDamage = player.stats.get('damage') * 0.3;
                    e1.takeDamage(bodyDamage);
                    
                    // 🔴 ADICIONE ESTA LINHA: Marca se o corpo-a-corpo matou o inimigo
                    if (e1.hp <= 0) e1.killedByPlayer = true; 

                    criarNumeroDano(e1.x, e1.y, bodyDamage, "white");
                    e1.ultimoDanoContato = tempoAtual;


                const dist = Math.sqrt(distSqP);
                if (dist > 0) {
                    const nx = dxP / dist;
                    const ny = dyP / dist;

                    // Aplica a Força (Repulsão / Inércia)
                    const forcaEmpurrao = 800;
                    const forcaRecuo = 300; // Força de atrito/tranco que o player sofre

                    e1.velX = (e1.velX || 0) - nx * forcaEmpurrao;
                    e1.velY = (e1.velY || 0) - ny * forcaEmpurrao;

                    // O jogador sofre um "tranco" na direção oposta (perdendo velocidade/escorregando)
                    player.velX = (player.velX || 0) + nx * forcaRecuo;
                    player.velY = (player.velY || 0) + ny * forcaRecuo;
                }
            }
        }

        // --- COLISÃO: INIMIGO E INIMIGO ---
        for (let j = i + 1; j < enemies.length; j++) {
            const e2 = enemies[j];
            if (e2.dead) continue;

            const dxE = e1.x - e2.x;
            const dyE = e1.y - e2.y;
            const distSqE = dxE * dxE + dyE * dyE;
            const minDistE = e1.radius + e2.radius;

            if (distSqE < minDistE * minDistE) {
                resolverSobreposicao(e1, e2, dxE, dyE, distSqE, minDistE);

                const dist = Math.sqrt(distSqE);
                if (dist > 0) {
                    const nx = dxE / dist;
                    const ny = dyE / dist;
                    const forcaRepulsao = 300;

                    e1.velX = (e1.velX || 0) + nx * forcaRepulsao;
                    e1.velY = (e1.velY || 0) + ny * forcaRepulsao;

                    e2.velX = (e2.velX || 0) - nx * forcaRepulsao;
                    e2.velY = (e2.velY || 0) - ny * forcaRepulsao;
                }

                const tempoAtual = performance.now();
                const cooldownInfight = 600;

                // e1 ataca e2 (Apenas dano direto, sem acionar o MeleeAction para não tremer a tela)
                if (!e1.ultimoDanoEmAliado || tempoAtual - e1.ultimoDanoEmAliado > cooldownInfight) {
                    const dano = 15; // Se quiser, pode trocar por: e1.type?.stats?.damage || 15
                    e2.takeDamage(dano);
                    criarNumeroDano(e2.x, e2.y, dano, "orange");
                    e1.ultimoDanoEmAliado = tempoAtual;
                }

                // e2 ataca e1 (Apenas dano direto)
                if (!e2.ultimoDanoEmAliado || tempoAtual - e2.ultimoDanoEmAliado > cooldownInfight) {
                    const dano = 15; 
                    e1.takeDamage(dano);
                    criarNumeroDano(e1.x, e1.y, dano, "orange");
                    e2.ultimoDanoEmAliado = tempoAtual;
                }
            }
        }
    } // <- Fim do loop principal dos inimigos

// --- BALAS DO PLAYER ---
    for (const b of player.bullets) {
        if (b.dead) continue;
        for (const e of enemies) {
            if (!e.dead && verificarColisao(b, e)) {
                e.takeDamage(b.damage);
                
                // 🔴 ADICIONE ESTA LINHA: Marca se o seu tiro matou o inimigo
                if (e.hp <= 0) e.killedByPlayer = true;

                camera.shake = 8;
                criarNumeroDano(e.x, e.y, b.damage, "white");
                b.onHit(e);
                if (b.dead) break;
            }
        }
    }


    // --- BALAS DOS INIMIGOS ---
    for (const atirador of enemies) {
        for (const b of atirador.bullets) {
            if (b.dead || !b.radius) continue;
            if (verificarColisao(b, player)) {
                player.hp -= b.damage;
                camera.shake = 12;
                criarNumeroDano(player.x, player.y, b.damage, "red");
                const bulletCfg = gameData.bullets[b.type];
                if (bulletCfg?.effect === 'stun') {
                    aplicarEfeitoDeStatus(player, 'stun', 1.5);
                }
                b.onHit(player);
                continue;
            }
            for (const vitima of enemies) {
                if (atirador !== vitima && !vitima.dead && verificarColisao(b, vitima)) {
                    vitima.takeDamage(b.damage);
                    criarNumeroDano(vitima.x, vitima.y, b.damage, "white");
                    b.onHit(vitima);
                    break;
                }
            }
        }
    }

    // --- PERIGOS DO CENÁRIO (HAZARDS) ---
    for (const h of hazards) {
        if (!h.dead && h.canDamage()) {
            const hObj = { x: h.x, y: h.y, radius: h.radius };
            if (verificarColisao(hObj, player)) {
                player.hp -= h.damage;
                criarNumeroDano(player.x, player.y, h.damage, "red");
                aplicarEfeitoDeStatus(player, h.type);
            }
            for (const e of enemies) {
                if (!e.dead && verificarColisao(hObj, e)) {
                    e.takeDamage(h.damage);
                    criarNumeroDano(e.x, e.y, h.damage, "white");
                    aplicarEfeitoDeStatus(e, h.type);
                }
            }
        }
    }
}
