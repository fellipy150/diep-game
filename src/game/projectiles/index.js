export class Bullet {
  constructor(config) {
    this.init(config)
  }
  init(config) {
    this.x = config.x
    this.y = config.y
    if (config.vx !== undefined && config.vy !== undefined) {
      this.vx = config.vx * config.speed
      this.vy = config.vy * config.speed
    } else if (config.targetX !== undefined) {
      const angle = Math.atan2(config.targetY - this.y, config.targetX - this.x)
      this.vx = Math.cos(angle) * config.speed
      this.vy = Math.sin(angle) * config.speed
    } else {
      this.vx = 0
      this.vy = 0
    }
    this.speed = config.speed
    this.damage = config.damage
    this.source = config.source
    this.type = config.type || 'normal'
    this.color = config.color || '#ffffff'
    this.radius = config.radius || 5
    this.dead = false
    this.pierceCount = config.pierceCount || 0
    this.bounces = config.bounces || 0
    this.life = config.life || 2.0
    this.effects = config.effects || []
  }
  update(dt, context) {
    if (this.dead) return
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.life -= dt
    if (this.life <= 0) {
      this.dead = true
    }
  }
  draw(ctx, camera) {
    const drawX = this.x - camera.x
    const drawY = this.y - camera.y
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  onHit(target, context) {
    if (this.pierceCount > 0) {
      this.pierceCount--
    } else {
      this.dead = true
    }
    for (const effect of this.effects) {
      if (effect.onHit) {
        effect.onHit(this, target, context)
      }
    }
  }
}
export class LobbedProjectile extends Bullet {
  constructor(config) {
    super(config)
  }
  init(config) {
    super.init(config)
    this.targetX = config.targetX || this.x
    this.targetY = config.targetY || this.y
    this.arrivalThreshold = 10
  }
  update(dt, context) {
    if (this.dead) return
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.hypot(dx, dy)
    if (dist < this.arrivalThreshold) {
      this.dead = true
    } else {
      this.x += (dx / dist) * this.speed * dt
      this.y += (dy / dist) * this.speed * dt
    }
    this.life -= dt
    if (this.life <= 0) this.dead = true
  }
}
