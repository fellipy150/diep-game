export const wandering = (enemy, dt) => {
    enemy.randomMoveTimer -= dt;
    
    if (enemy.randomMoveTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        enemy.randomMoveDir = { x: Math.cos(angle), y: Math.sin(angle) };
        enemy.randomMoveTimer = 1 + Math.random() * 2; // Muda de direção a cada 1-3s
    }
    
    return enemy.randomMoveDir;
};
