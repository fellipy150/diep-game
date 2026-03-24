import { dodge } from './dodge.js';
import { Pursue } from './Pursue.js';
import { wandering } from './wandering.js';

export const MoveActions = {
    pursue: (enemy, target) => {
        // Trava de segurança antes de chamar a matemática pura do Pursue.js
        if (!target || target.dead) return { x: 0, y: 0 };
        return Pursue(enemy, target);
    },
    
    flee: (enemy, target) => {
        if (!target || target.dead) return { x: 0, y: 0 };
        const p = Pursue(enemy, target);
        return { x: -p.x, y: -p.y };
    },
    
    wandering: wandering,
    
    dodge: dodge
};
