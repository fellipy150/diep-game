import { ProjectilePool } from '../../projectiles/ProjectilePool.js'
import { LobbedProjectile } from '../../projectiles/index.js'
import { WeaponBase } from '../base/WeaponBase.js'
import { gameData } from '../../../config/configManager.js'
import { SynergyRegistry } from '../../synergies/SynergyRegistry.js'
import { BulletEffects } from './BulletEffects.js'

export class GunWeapon extends WeaponBase {
  constructor(config) {
    super(config.id || 'basic_gun', config.name || 'Pistola')
    this.magSize = config.magSize || 8
    this.currentAmmo = this.magSize
    this.reloadTime = config.reloadTime || 0.8
    this.reloadTimer = 0
    this.burstDelay = config.burstDelay || 0.1
    this.burstTimer = 0
    this.bulletColor = config.bulletColor || '#00ffff'
    this.bulletType = config.bulletType || 'normal'
    this.weight = config.weight || 1
    this.icon = config.icon || '🔫'
    this.baseDamage = config.baseDamage || 10
    this.baseBulletSpeed = config.baseBulletSpeed || 300
  }
  update(dt, _context) {
    if (this.currentAmmo < this.magSize) {
      this.reloadTimer += dt
      if (this.reloadTimer >= this.reloadTime) {
        this.currentAmmo++
        this.reloadTimer = 0
      }
    }
    if (this.burstTimer > 0) {
      this.burstTimer -= dt
    }
  }
  executeFire(context, aimDir) {
    if (this.currentAmmo <= 0 || this.burstTimer > 0) return false
    const p = this.owner
    if (!p) return false
    let damage = this.baseDamage
    let bulletSpeed = this.baseBulletSpeed
    let multishot = 1
    const isPlayer = !!p.inventory
    if (p.stats) {
      damage += p.stats.get('damage') || 0
      bulletSpeed += p.stats.get('bulletSpeed') || 0
      multishot = p.stats.get('multiShot') || 1
    }
    const config = (gameData.bullets && gameData.bullets[this.bulletType]) || {
      multishotScale: 1,
      type: 'normal',
    }
    // 2. LÓGICA DE MULTISHOT / SPREAD
    const baseAngle = Math.atan2(aimDir.y, aimDir.x)
    const shotCount =
      config.multishotScale === 0
        ? 1
        : Math.max(1, Math.round(multishot * (config.multishotScale || 1)))
    const spread = (15 * Math.PI) / 180
    const startAngle = baseAngle - (spread * (shotCount - 1)) / 2
    for (let i = 0; i < shotCount; i++) {
      const ang = startAngle + i * spread
      const vx = Math.cos(ang)
      const vy = Math.sin(ang)
      const bulletConfig = {
        x: p.x,
        y: p.y,
        vx: vx,
        vy: vy,
        speed: bulletSpeed,
        damage: damage,
        source: isPlayer ? 'player' : 'enemy',
        color: this.bulletColor,
        type: this.bulletType,
        effects: p.activeBulletEffects ? [...p.activeBulletEffects] : [],
        pierceCount: 0,
        bounces: 0,
      }
      if (bulletConfig.effects && bulletConfig.effects.length > 0) {
        BulletEffects.apply(bulletConfig)
      }
      if (isPlayer && p.activeSynergies) {
        p.activeSynergies.forEach(synId => {
          const syn = SynergyRegistry.find(s => s.id === synId)
          if (!syn || !syn.effect?.applyToBullet) return
          const conditionMet =
            !syn.condition ||
            (p.synergyConditionsMet && p.synergyConditionsMet[synId])
          if (conditionMet) {
            syn.effect.applyToBullet(bulletConfig, p)
          }
        })
      }
      let projectile
      if (config.type === 'lobbed') {
        projectile = new LobbedProjectile({
          ...bulletConfig,
          targetX: p.x + vx * 400,
          targetY: p.y + vy * 400,
        })
      } else {
        projectile = ProjectilePool.get(bulletConfig)
      }
      if (context.addProjectile) {
        context.addProjectile(projectile)
      } else if (context.bullets) {
        context.bullets.push(projectile)
      }
    }
    this.currentAmmo--
    this.burstTimer = this.burstDelay
    return true
  }
}
