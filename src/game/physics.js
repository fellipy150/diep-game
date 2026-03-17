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
        const dxP = player.x - e1.x;
        const dyP = player.y - e1.y;
        const distSqP = dxP * dxP + dyP * dyP;
        const minDistP = player.radius + e1.radius;
        if (distSqP < minDistP * minDistP) {
            resolverSobreposicao(player, e1, dxP, dyP, distSqP, minDistP);
            MeleeAction.execute(e1, player, criarNumeroDano);
        }
        for (let j = i + 1; j < enemies.length; j++) {
            const e2 = enemies[j];
            if (e2.dead) continue;
            const dxE = e1.x - e2.x;
            const dyE = e1.y - e2.y;
            const distSqE = dxE * dxE + dyE * dyE;
            const minDistE = e1.radius + e2.radius;
            if (distSqE < minDistE * minDistE) {
                resolverSobreposicao(e1, e2, dxE, dyE, distSqE, minDistE);
            }
        }
    }
    for (const b of player.bullets) {
        if (b.dead) continue;
        for (const e of enemies) {
            if (!e.dead && verificarColisao(b, e)) {
                e.takeDamage(b.damage);
                camera.shake = 8;
                criarNumeroDano(e.x, e.y, b.damage, "white");
                b.onHit(e);
                if (b.dead) break;
            }
        }
    }
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
