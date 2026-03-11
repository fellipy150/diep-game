import { gameData } from "./main.js";

// Lista global para processamento de perigos (Fogo, ácido, etc.)
export const hazards = [];

export class Bullet {
    constructor(x, y, dirX, dirY, baseSpeed, baseDamage, owner = 'player', type = 'normal', target = null) {
        // Acessa a configuração carregada do JSON global
        const config = gameData.bullets[type] || gameData.bullets.normal;
        
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        
        this.type = type;
        this.owner = owner;
        this.target = target;
        this.dead = false;
        this.lifeTime = 0;
        
        // Define tempo de vida baseado no tipo
        this.maxLife = type === 'time_bomb' ? (owner === 'player' ? 5 : 3) : (type === 'drone' ? 60 : 2);
        
        // Atributos escalonados pelos multiplicadores do JSON
        this.speed = baseSpeed * (config.speedMult || 1);
        this.damage = baseDamage * (config.damageMult || 1);
        this.radius = config.radius || 5;
        this.color = config.color;

        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;

        // Estados especializados
        this.startX = x;
        this.startY = y;
        this.baseX = x;
        this.baseY = y;
        this.trailTimer = 0;
        this.bounces = 0;
    }

    update(dt, playerPos) {
        this.lifeTime += dt;
        if (this.lifeTime >= this.maxLife) {
            this.handleTimeout();
            return;
        }

        switch (this.type) {
            case 'sine':
                this.baseX += this.vx * dt;
                this.baseY += this.vy * dt;
                let osc = Math.sin(this.lifeTime * 15) * 40;
                this.x = this.baseX + (-this.dirY * osc);
                this.y = this.baseY + (this.dirX * osc);
                break;
            case 'boomerang':
                let progress = this.lifeTime / this.maxLife;
                let angle = progress * Math.PI;
                let dist = Math.sin(angle) * (this.speed * 0.8);
                let lateral = Math.sin(angle * 2) * (this.speed * 0.2);
                this.x = this.startX + (this.dirX * dist) + (-this.dirY * lateral);
                this.y = this.startY + (this.dirY * dist) + (this.dirX * lateral);
                break;
            case 'homing':
            case 'drone':
                if (this.target && !this.target.dead) {
                    let tx = this.target.x - this.x;
                    let ty = this.target.y - this.y;
                    let tLen = Math.hypot(tx, ty);
                    if (tLen > 0) {
                        let turnSpeed = this.type === 'drone' ? 0.02 : 0.05;
                        this.dirX = this.dirX * (1 - turnSpeed) + (tx / tLen) * turnSpeed;
                        this.dirY = this.dirY * (1 - turnSpeed) + (ty / tLen) * turnSpeed;
                        let n = Math.hypot(this.dirX, this.dirY);
                        this.dirX /= n; this.dirY /= n;
                        this.vx = this.dirX * this.speed;
                        this.vy = this.dirY * this.speed;
                    }
                }
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                break;
            default:
                this.x += this.vx * dt;
                this.y += this.vy * dt;
        }

        if (this.type === 'fire') {
            this.trailTimer += dt;
            if (this.trailTimer > 0.1) {
                hazards.push(new Hazard(this.x, this.y, 12, 1.5, this.damage * 0.3, 'fire'));
                this.trailTimer = 0;
            }
        }
    }

    onHit(target) {
        if (this.type === 'rubber') {
            this.bounces++;
            this.speed *= 1.25;
            this.damage *= 1.3;
            let nx = this.x - target.x;
            let ny = this.y - target.y;
            let nl = Math.hypot(nx, ny);
            if (nl > 0) {
                this.dirX = nx / nl; this.dirY = ny / nl;
                this.vx = this.dirX * this.speed; this.vy = this.dirY * this.speed;
            }
            if (this.bounces > 3) this.dead = true;
        } else if (this.type === 'mine') {
            hazards.push(new Hazard(this.x, this.y, 60, 0.5, this.damage * 2, 'explosion'));
            this.dead = true;
        } else {
            this.dead = true;
        }
    }

    handleTimeout() {
        this.dead = true;
        if (this.type === 'time_bomb' || this.type === 'drone') {
            hazards.push(new Hazard(this.x, this.y, 70, 0.6, this.damage * 3, 'explosion'));
        }
    }

    draw(ctx, camera, playerPos) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;
        let alpha = 1;
        
        // Efeito de camuflagem para balas invisíveis
        if (this.type === 'invisible' && playerPos) {
            let d = Math.hypot(this.x - playerPos.x, this.y - playerPos.y);
            alpha = Math.max(0, 1 - (d / 400));
        }
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export class LobbedProjectile {
    constructor(x, y, targetX, targetY, type = 'bomb', baseDamage) {
        const config = gameData.bullets[type] || gameData.bullets.bomb;
        
        this.startX = x; this.startY = y;
        this.targetX = targetX; this.targetY = targetY;
        this.x = x; this.y = y; this.z = 0;
        
        this.type = type;
        this.damage = baseDamage * (config.damageMult || 1);
        this.lifeTime = 0;
        this.flightTime = 1.5;
        this.dead = false;
    }

    update(dt) {
        this.lifeTime += dt;
        let p = this.lifeTime / this.flightTime;
        if (p >= 1) { this.land(); return; }
        
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        this.z = Math.sin(p * Math.PI) * 200; // Arco parabólico
    }

    land() {
        this.dead = true;
        switch(this.type) {
            case 'acid': hazards.push(new Hazard(this.targetX, this.targetY, 45, 3, this.damage * 0.4, 'acid')); break;
            case 'bomb': hazards.push(new Hazard(this.targetX, this.targetY, 65, 0.5, this.damage * 2.5, 'explosion')); break;
            case 'glue': hazards.push(new Hazard(this.targetX, this.targetY, 55, 4, 1, 'glue')); break;
            case 'quicker': hazards.push(new Hazard(this.targetX, this.targetY, 30, 0.3, this.damage, 'explosion')); break;
        }
    }

    draw(ctx, camera) {
        let dx = this.x - camera.x;
        let dy = (this.y - this.z) - camera.y;
        
        // Sombra
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, 8, 0, Math.PI*2); ctx.fill();
        
        // Projétil no ar
        ctx.fillStyle = this.type === 'acid' ? 'lime' : 'white';
        ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI*2); ctx.fill();
    }
}

export class Hazard {
    constructor(x, y, radius, life, dmg, type) {
        this.x = x; this.y = y; this.radius = radius;
        this.maxLife = life; this.lifeTime = 0;
        this.damage = dmg; this.type = type;
        this.dead = false; this.tickTimer = 0;
    }
    update(dt) {
        this.lifeTime += dt;
        this.tickTimer += dt;
        if (this.lifeTime >= this.maxLife) this.dead = true;
    }
    canDamage() {
        if (this.tickTimer > 0.4) { this.tickTimer = 0; return true; }
        return false;
    }
    draw(ctx, camera) {
        let dx = this.x - camera.x;
        let dy = this.y - camera.y;
        let a = 1 - (this.lifeTime / this.maxLife);
        ctx.globalAlpha = a * 0.5;
        
        ctx.fillStyle = this.type === 'fire' ? 'orange' : 
                       (this.type === 'acid' ? 'lime' : 
                       (this.type === 'glue' ? 'brown' : 'yellow'));
                       
        ctx.beginPath(); ctx.arc(dx, dy, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Pool de munições especiais derivada dinamicamente do JSON carregado.
 * Retorna todos os IDs de balas exceto a 'normal'.
 */
export const SPECIAL_BULLETS_POOL = Object.keys(gameData.bullets || {}).filter(k => k !== 'normal');
