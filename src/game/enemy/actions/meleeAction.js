import { camera } from "../../../game/renderer.js";

export const MeleeAction = {
    execute: (attacker, target, createDamageNumber) => {
        if (attacker.meleeCooldown > 0) return;
        const damage = attacker.meleeDamage || attacker.type?.stats?.meleeDamage || 10;
        const cooldownTime = attacker.meleeCooldownRate || attacker.type?.stats?.meleeCooldownRate || 1.0;
        if (typeof target.takeDamage === 'function') {
            target.takeDamage(damage);
        } else {
            target.hp -= damage;
        }
        camera.shake = attacker.type?.stats?.meleeShakePower || 5;
        if (createDamageNumber) {
            createDamageNumber(target.x, target.y, damage, "red");
        }
        attacker.meleeCooldown = cooldownTime;
        const knockback = attacker.knockbackPower || attacker.type?.stats?.knockbackPower;
        if (knockback) {
            applyKnockback(attacker, target, knockback);
        }
    }
};
function applyKnockback(attacker, target, force) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    target.velX = (target.velX || 0) + (dx / dist) * force;
    target.velY = (target.velY || 0) + (dy / dist) * force;
}
