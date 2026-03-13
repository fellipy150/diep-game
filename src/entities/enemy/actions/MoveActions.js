export const MoveActions = {
    pursue: (enemy, target) => {
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: dx / dist, y: dy / dist };
    },

    flee: (enemy, target) => {
        const p = MoveActions.pursue(enemy, target);
        return { x: -p.x, y: -p.y };
    },

    // A esquiva agora é uma Ação que retorna um vetor ou null
    evade: (enemy, threatBullets) => {
        if (!threatBullets || enemy.dodgeCheckTimer > 0) return null;
        
        for (let b of threatBullets) {
            if (b.sender === enemy) continue;
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;
            
            if ((dx * dx + dy * dy) < 14400) { // 120px
                return { x: -b.vy, y: b.vx }; // Retorna o vetor de esquiva
            }
        }
        return null;
    }
};
