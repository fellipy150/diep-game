import { GunWeapon } from '../GunWeapon.js';

const StandardGunConfig = {
    id: 'standard_gun',
    name: 'Pistola Padrão',
    magSize: 3,         // 🔴 CORRIGIDO: Mudamos de maxSlots para magSize
    weight: 1,          // 🔴 NOVO: Adicionado o peso da arma
    reloadTime: 1.5,
    burstDelay: 0.1,
    bulletColor: '#00ffff',
    bulletType: 'normal'
};

export function createStandardGun(overrides = {}) {
    const finalConfig = { ...StandardGunConfig, ...overrides };
    return new GunWeapon(finalConfig);
}
