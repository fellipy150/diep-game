
export class Bullet {
    constructor(x, y, vx, vy, speed, damage, source, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.speed = speed;
        this.damage = damage;
        this.source = source;
        this.type = type;
        this.radius = 5;
        this.dead = false;
        this.life = 2.0; // 🔴 Garante que a bala suma após 2s se não bater em nada
    }

    update(dt) {
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        
        ctx.fillStyle = "#f1c40f"; // Amarelo padrão
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    onHit(_target) {
        this.dead = true; // Por padrão, a bala morre ao encostar
    }
}

export class LobbedProjectile extends Bullet {
    constructor(x, y, targetX, targetY, type, damage) {
        super(x, y, 0, 0, 0, damage, 'player', type);
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = 8;
        this.speed = 400;
    }

    update(dt) {
        // Lógica provisória de arco direto (será refeita na Fase 3)
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
