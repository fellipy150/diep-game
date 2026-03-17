import { MoveActions } from '../actions/MoveActions.js';
import { CombatActions } from '../actions/CombatActions.js';
import { TargetingActions } from '../actions/TargetingActions.js';

export const CannonFodder = {
    stats: {
        hp: 50,
        acceleration: 450,
        fireRate: 2.0,
        bulletSpeed: 250,
        damage: 10,
        radius: 18,
        color: '#8B9BB4',
        behavior: 'aggressive'
    },
    think: (enemy, dt, player, allEnemies) => {
        const target = TargetingActions.getClosestTarget(enemy, player, allEnemies);
        if (target) {
            enemy.shootTarget = target;
            const distSq = enemy.getDistSq(target);
            if (distSq < 400 * 400) {
                CombatActions.simpleShoot(enemy);
            }
            return MoveActions.pursue(enemy, target);
        }
        return MoveActions.wandering(enemy, dt);
    }
};
