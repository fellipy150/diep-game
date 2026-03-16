import { camera } from "../../../game/renderer.js";

export const MeleeAction = {
    execute: (attacker, target, createDamageNumber) => {
        if (attacker.meleeCooldown > 0) return;

        // Tenta pegar o dano direto do objeto, depois do DNA (stats), ou usa 10 de fallback
        const damage = attacker.meleeDamage || attacker.type?.stats?.meleeDamage || 10;
        const cooldownTime = attacker.meleeCooldownRate || attacker.type?.stats?.meleeCooldownRate || 1.0;

        // 🛡️ PROTEÇÃO 1: Fallback de Dano (Evita crash se o alvo não tiver takeDamage)
        if (typeof target.takeDamage === 'function') {
            target.takeDamage(damage);
        } else {
            // Se for o Player e ele não tiver a função, tiramos o HP diretamente
            target.hp -= damage; 
        }

        // Feedback visual
        camera.shake = attacker.type?.stats?.meleeShakePower || 5;
        if (createDamageNumber) {
            createDamageNumber(target.x, target.y, damage, "red");
        }

        attacker.meleeCooldown = cooldownTime;
        
        // Aplica empurrão se o inimigo tiver força de knockback
        const knockback = attacker.knockbackPower || attacker.type?.stats?.knockbackPower;
        if (knockback) {
            applyKnockback(attacker, target, knockback);
        }
    }
};

function applyKnockback(attacker, target, force) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    // Evita divisão por zero
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // 🛡️ PROTEÇÃO 2: Escudo Anti-NaN
    // Garante que velX e velY existam e sejam números antes de somar a força
    target.velX = (target.velX || 0) + (dx / dist) * force;
    target.velY = (target.velY || 0) + (dy / dist) * force;
}
