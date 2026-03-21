import { MathUtils } from "../../../core/math.js";
// src/game/enemy/actions/CombatActions.js
export const CombatActions = {
    simpleShoot: (enemy, context) => {
        if (!enemy.shootTarget || !enemy.weapon) return;
        const dx = enemy.shootTarget.x - enemy.x;
        const dy = enemy.shootTarget.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        const aimDir = { x: dx / dist, y: dy / dist };
        const finalContext = context || {
            addProjectile: (p) => {
                if (!enemy.bullets) enemy.bullets = [];
                enemy.bullets.push(p);
            }
        };
        enemy.weapon.executeFire(finalContext, aimDir);
    }
};
