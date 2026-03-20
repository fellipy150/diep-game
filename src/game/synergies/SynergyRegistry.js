import { BulletEffects } from '../weapon/gun/BulletEffects.js';

// Efeito customizado injetável pela sinergia
const GhostPenetrateEffect = {
    id: 'ghost_penetrate',
    onHit: (bullet, target, context) => {
        if (bullet.pierceCount > 0) {
            bullet.pierceCount--;
            // Perde 15% de dano a cada inimigo atravessado
            bullet.damage *= 0.85; 
            bullet.dead = false;
            return true;
        }
        return false;
    }
};

export const SynergyRegistry = [
    {
        id: 'syn_ghost_bullet',
        name: 'Bala Fantasma',
        description: 'Sua bala atravessa até 3 inimigos, perdendo dano a cada acerto.',
        requiredBulletId: 'normal', // Ou 'rubber_bullet' como sugerido no seu doc
        requiredPowerupId: 'ghost_pass', // ID do upgrade que precisa ser coletado
        requiredCount: 3, // Precisa pegar o item 3 vezes
        duration: null, // Permanente
        condition: null, // Sempre ativa enquanto equipada
        
        // Como essa sinergia altera a bala no momento do disparo:
        effect: {
            type: 'inject_effect',
            applyToBullet: (bulletConfig) => {
                bulletConfig.pierceCount = (bulletConfig.pierceCount || 0) + 3;
                bulletConfig.effects.push(GhostPenetrateEffect);
                bulletConfig.color = 'rgba(255, 255, 255, 0.5)'; // Deixa a bala semi-transparente!
            }
        }
    }
];
