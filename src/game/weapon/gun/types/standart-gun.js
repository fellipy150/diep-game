import { GunWeapon } from '../GunWeapon.js';

const StandardGunConfig = {
    id: 'standard_gun',
    name: 'Pistola Padrão',
    maxSlots: 3,
    reloadTime: 1.5,
    burstDelay: 0.1,
    bulletColor: '#00ffff',
    bulletType: 'normal'
};
export function createStandardGun(overrides = {}) {
    const finalConfig = { ...StandardGunConfig, ...overrides };
    return new GunWeapon(finalConfig);
}
