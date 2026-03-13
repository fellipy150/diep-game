export const dodge = (enemy, threatBullets) => {
    if (!threatBullets || threatBullets.length === 0) return null;

    for (let b of threatBullets) {
        if (b.sender === enemy) continue;
        
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        
        // Se a bala estiver próxima (raio de 120px)
        if ((dx * dx + dy * dy) < 14400) {
            // Retorna vetor perpendicular à trajetória da bala
            return { x: -b.vy, y: b.vx };
        }
    }
    return null;
};
