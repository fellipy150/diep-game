import { getType } from './types/typeLoader.js'
import { RenderEnemy } from './systems/RenderSystem.js'
import { MathUtils } from '../../core/math.js'
import { StatSheet } from '../player/status.js'

export class Enemy {
  constructor(configOrX, y, typeName, level) {
    try {
      this._cachedContext = {
        enemies: null,
        player: null,
        hazards: null,
        dt: 0,
        addProjectile: p => {
          this.bullets.push(p)
        },
      }
      if (typeof configOrX === 'object') {
        this.init(configOrX)
      } else {
        this.init({ x: configOrX, y, typeName, level })
      }
    } catch (error) {
      console.error('Erro no constructor da classe Enemy:', error)
    }
  }
  init(config) {
    try {
      this.type =
        typeof config.typeName === 'string'
          ? getType(config.typeName)
          : config.type
      this.x = config.x
      this.y = config.y
      this.level = config.level || 1
      const baseConfig = this.type.stats || {}
      this._baseConfig = baseConfig
      this.stats = new StatSheet({
        maxHp: baseConfig.hp || 100,
        speed: baseConfig.speed || 200,
        acceleration: baseConfig.acceleration || 800,
        meleeDamage: baseConfig.meleeDamage || 10,
        rangedDamage: baseConfig.rangedDamage || 5,
        damage: baseConfig.damage || 0,
        bulletSpeed: baseConfig.bulletSpeed || 0,
        fireRate: baseConfig.fireRate || 0.2,
        reloadTime: baseConfig.reloadTime || 2.5,
      })
      this.maxHp = this.stats.get('maxHp')
      this.hp = this.maxHp
      this.speed = this.stats.get('speed')
      this.acceleration = this.stats.get('acceleration')
      this.friction = 0.85
      this.velX = 0
      this.velY = 0
      this.baseMeleeDamage = this.stats.get('meleeDamage') * this.level
      this.rangedDamage = this.stats.get('rangedDamage') * this.level
      this.currentMeleeDamage = this.baseMeleeDamage
      this.dead = false
      this.bullets = []
      this.dodgeCheckTimer = 0
      this.attackCooldown = 0
      this.meleeCooldown = 0 // 🟢 Inicializando a variável para evitar undefined
      this.thinkTimer = Math.random() * 0.2
      this.lastMoveIntent = { x: 0, y: 0 }
      this.playerDamageDealt = 0
      this.outOfCombatTimer = 0
      this.baseXp = 40
      this.color = baseConfig.color || '#ff0000'
      this.radius = baseConfig.radius || 25
    } catch (error) {
      console.error('Erro no método init da classe Enemy:', error)
    }
  }
  update(dt, player, allEnemies, hazards) {
    try {
      if (this.dead) return
      this._cachedContext.dt = dt
      this._cachedContext.enemies = allEnemies
      this._cachedContext.player = player
      this._cachedContext.hazards = hazards
      const distSq = MathUtils.distSq(this.x, this.y, player.x, player.y)
      const OFFSCREEN_RADIUS_SQ = 1200 * 1200
      if (distSq > OFFSCREEN_RADIUS_SQ) {
        const dir = MathUtils.getDir(this.x, this.y, player.x, player.y)
        this.x += dir.x * this.speed * dt
        this.y += dir.y * this.speed * dt
        this.currentMeleeDamage = this.baseMeleeDamage + this.rangedDamage
        return
      }
      this.currentMeleeDamage = this.baseMeleeDamage
      if (this.attackCooldown > 0) this.attackCooldown -= dt
      if (this.dodgeCheckTimer > 0) this.dodgeCheckTimer -= dt
      if (this.meleeCooldown > 0) this.meleeCooldown -= dt // 🔴 A LINHA QUE FALTAVA!
      this.thinkTimer -= dt
      if (this.thinkTimer <= 0) {
        const moveIntent = this.type.think(
          this,
          dt,
          player,
          allEnemies,
          hazards
        )
        if (moveIntent) {
          this.lastMoveIntent.x = moveIntent.x
          this.lastMoveIntent.y = moveIntent.y
        }
        this.thinkTimer = 0.5
      }
      this.velX += this.lastMoveIntent.x * this.acceleration * dt
      this.velY += this.lastMoveIntent.y * this.acceleration * dt
      this.velX *= this.friction
      this.velY *= this.friction
      this.x += this.velX * dt
      this.y += this.velY * dt
      this.outOfCombatTimer += dt
      if (this.outOfCombatTimer > 5.0) {
        const regen = this.maxHp * 0.02 * dt
        this.hp = Math.min(this.maxHp, this.hp + regen)
      }
      if (this.weapon) {
        this.weapon.update(dt, this._cachedContext)
      }
      this.updateBullets(dt, player)
    } catch (error) {
      console.error('Erro no método update da classe Enemy:', error)
    }
  }
  updateBullets(dt) {
    try {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i]
        if (typeof b.update === 'function') {
          b.update(dt, this._cachedContext)
        } else {
          b.x += (b.vx || 0) * dt
          b.y += (b.vy || 0) * dt
          if (b.life !== undefined) {
            b.life -= dt
            if (b.life <= 0) b.dead = true
          }
        }
        if (b.dead) this.bullets.splice(i, 1)
      }
    } catch (error) {
      console.error('Erro no updateBullets:', error)
    }
  }
  takeDamage(amount, source = 'other') {
    try {
      this.hp -= amount
      this.outOfCombatTimer = 0
      if (source === 'player') {
        this.playerDamageDealt += amount
      }
      if (this.hp <= 0) {
        this.hp = 0
        this.dead = true
      }
    } catch (error) {
      console.error('Erro no método takeDamage da classe Enemy:', error)
    }
  }
  draw(ctx, camera) {
    try {
      RenderEnemy(ctx, camera, this)
    } catch (error) {
      console.error('Erro no método draw da classe Enemy:', error)
    }
  }
  getDistSq(target) {
    try {
      return MathUtils.distSq(this.x, this.y, target.x, target.y)
    } catch (error) {
      console.error('Erro no método getDistSq da classe Enemy:', error)
      return Infinity
    }
  }
}
