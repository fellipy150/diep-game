import * as normal from './normal.js';
import * as giant from './giant.js';
export const bulletConfigs = {
    normal: {
        speedMult: 1.0,
        damageMult: 1.0,
        radius: 5,
        color: '#ffffff',
        maxLife: 3.0,
        fireRateMult: 1.0,
        multishotScale: 1.0
    },
    giant: {
        speedMult: 0.6,
        damageMult: 3.0,
        radius: 15,
        color: '#ff4444',
        maxLife: 5.0,
        fireRateMult: 0.5,
        multishotScale: 0.5,
        effect: 'stun'
    },
    bomb: { speedMult: 0.8, damageMult: 2.0, radius: 8, color: '#ffaa00', maxLife: 2.0, fireRateMult: 0.8, multishotScale: 1.0 },
    acid: { speedMult: 0.9, damageMult: 0.5, radius: 6, color: '#00ff00', maxLife: 4.0, fireRateMult: 1.2, multishotScale: 1.0 },
    glue: { speedMult: 0.7, damageMult: 0.2, radius: 7, color: '#ffff00', maxLife: 3.0, fireRateMult: 1.0, multishotScale: 1.0 }
};
