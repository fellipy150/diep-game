import { camera } from "../../../game/renderer.js";
export const MeleeAction = {
    execute: (attacker, target, createDamageNumber) => {
        if (attacker.meleeCooldown > 0) return;
        const damage = attacker.meleeDamage || 10;
        const cooldownTime = attacker.meleeCooldownRate || 1.0;
        target.takeDamage(damage);
        camera.shake = attacker.meleeShakePower || 5;
        if (createDamageNumber) {
            createDamageNumber(target.x, target.y, damage, "red");
        }
        attacker.meleeCooldown = cooldownTime;
        if (attacker.knockbackPower) {
            applyKnockback(attacker, target);
        }
    }
};
function applyKnockback(attacker, target) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = attacker.knockbackPower;
    target.velX += (dx / dist) * force;
    target.velY += (dy / dist) * force;
}
