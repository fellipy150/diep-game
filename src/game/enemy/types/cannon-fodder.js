import { MoveActions } from '../actions/MoveActions.js'
import { CombatActions } from '../actions/CombatActions.js'
import { TargetingActions } from '../actions/TargetingActions.js'
import { createStandardGun } from '../../weapon/gun/types/standart-gun.js'

export const CannonFodder = {
  stats: {
    hp: 135,
    acceleration: 1000,
    fireRate: 0.4,
    maxAmmo: 3,
    reloadTime: 2.5,
    bulletSpeed: 0,
    damage: 0,
    radius: 18,
    color: '#8B9BB4',
    behavior: 'aggressive',
  },
  init: enemy => {
    if (!enemy.weapon) {
      enemy.weapon = createStandardGun({
        bulletColor: '#ff4444',
        reloadTime: enemy.stats.get('reloadTime'),
        magSize: enemy.type.stats.maxAmmo || 3,
        burstDelay: enemy.stats.get('fireRate'),
      })
      enemy.weapon.owner = enemy
    }
  },
  think: (enemy, dt, player, allEnemies) => {
    if (enemy.type.init) enemy.type.init(enemy)
    const target = TargetingActions.getClosestTarget(enemy, player, allEnemies)
    if (target) {
      enemy.shootTarget = target
      const distSq = enemy.getDistSq(target)
      if (distSq < 400 * 400) {
        CombatActions.simpleShoot(enemy, enemy._cachedContext)
      }
      return MoveActions.pursue(enemy, target)
    }
    return MoveActions.wandering(enemy, dt)
  },
}
