import { MoveActions } from '../actions/MoveActions.js';
import { CombatActions } from '../actions/CombatActions.js';

export const CannonFodder = {
    // 1. O que ele É
    stats: {
        hp: 50,                  // Vida baixa
        acceleration: 450,       // Relativamente lento
        fireRate: 2.5,           // Atira devagar (a cada 2.5s)
        bulletSpeed: 200,        // Bala lenta
        damage: 10,
        radius: 18,
        color: '#8B9BB4',        // Um cinza-azulado fosco, sem muito destaque
        shape: 'circle',
        behavior: 'hybrid',      // Causa dano melee se encostar, e atira de longe
        meleeDamage: 15,
        meleeCooldownRate: 1.0
    },

    // 2. Como ele EVOLUI (O Spawner vai usar isso)
    upgradeStrategy: {
        // Buchas de canhão ganham vida e um pouquinho de velocidade para formar hordas piores
        priorities: ['hp', 'acceleration'],
        weights: { hp: 0.7, acceleration: 0.3 } 
    },

    // 3. O que ele FAZ (O Cérebro)
    think: (enemy, dt, player, allEnemies, threatBullets) => {
        // Nota: O Cannon Fodder é burro. Ele NÃO chama o MoveActions.dodge(). 
        // Ele vai tomar tiro na cara feliz da vida.

        if (player && !player.dead) {
            enemy.shootTarget = player;
            const distSq = enemy.getDistSq(player);

            // Se estiver na mesma tela (aprox 600px de distância), ele atira
            if (distSq < 360000) {
                CombatActions.simpleShoot(enemy);
            }

            // O movimento é puramente ir na direção do player o tempo todo. Sem recuar.
            return MoveActions.pursue(enemy, player);
        }

        // Se o player morrer, ele fica andando sem rumo pelo mapa
        enemy.shootTarget = null;
        return MoveActions.wandering(enemy, dt);
    }
};
