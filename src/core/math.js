// src/core/math.js
export const MathUtils = {
    distSq(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return (dx * dx) + (dy * dy);
    },
    // 🐢 MAIS LENTO: Use APENAS quando precisar da distância exata (ex: ui/HUD, raio de explosão visual)
    dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },
    getDir(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const d = Math.hypot(dx, dy) || 1;
        return { x: dx / d, y: dy / d, dist: d };
    }
};
