export const dodge = (enemy, threatBullets) => {
    if (!threatBullets || threatBullets.length === 0) return null;
    for (let b of threatBullets) {
        if (b.sender === enemy) continue;
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        if ((dx * dx + dy * dy) < 14400) {
            return { x: -b.vy, y: b.vx };
        }
    }
    return null;
};
