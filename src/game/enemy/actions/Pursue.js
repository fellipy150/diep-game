import { MathUtils } from "../../../core/math.js";

export const Pursue = (enemy, target) => {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / dist, y: dy / dist };
};
