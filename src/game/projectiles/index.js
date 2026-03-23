export class Bullet {
    constructor(config) {
        this.init(config);
    }
    init(config) {
        Object.assign(this, config);
        this.radius = config.radius || 5;
        this.color = config.color || '#fff';
        this.dead = false;
        this.life = config.life || 2.0;
        this.effects = config.effects || [];
        this.bounces = config.bounces || 0;
        this.pierceCount = config.pierceCount || 0;
    }
    update(dt) {
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    onHit(_target, _context) {
        if (this.pierceCount <= 0) {
            this.dead = true;
        } else {
            this.pierceCount--;
        }
        for (const effect of this.effects) {
            if (effect.onHit) {
                const handled = effect.onHit(this, _target, _context);
                if (handled) break;
            }
        }
    }
}
export class LobbedProjectile extends Bullet {
    constructor(config) {
        super(config);
    }
    init(config) {
        super.init(config);
        this.targetX = config.targetX || this.x;
        this.targetY = config.targetY || this.y;
        this.speed = config.speed || 400;
    }
    update(dt) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
            this.dead = true;
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
}
