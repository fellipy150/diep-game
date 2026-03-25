import { GunWeapon } from '../GunWeapon.js'

const StandardGunConfig = {
  id: 'standard_gun',
  name: 'Pistola Padrão',
  magSize: 3,
  weight: 1,
  reloadTime: 1.5,
  burstDelay: 0.1,
  bulletColor: '#00ffff',
  bulletType: 'normal',
  baseDamage: 15,
  baseBulletSpeed: 400,
}
export function createStandardGun(overrides = {}) {
  const finalConfig = { ...StandardGunConfig, ...overrides }
  return new GunWeapon(finalConfig)
}
