import { dodge } from './dodge.js';
export const MoveActions = {
    pursue: (enemy, target) => {
        if (!target || target.dead) return { x: 0, y: 0 };
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return { x: 0, y: 0 };
        return { x: dx / dist, y: dy / dist };
    },
    flee: (enemy, target) => {
        const p = MoveActions.pursue(enemy, target);
        return { x: -p.x, y: -p.y };
    },
    wandering: (enemy, dt) => {
        enemy.randomMoveTimer = (enemy.randomMoveTimer || 0) - dt;
        if (enemy.randomMoveTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            enemy.randomMoveDir = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
            enemy.randomMoveTimer = 1 + Math.random() * 2;
        }
        return enemy.randomMoveDir || { x: 0, y: 0 };
    },
    dodge: dodge
};
