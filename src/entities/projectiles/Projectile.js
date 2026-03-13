import { gameData } from "../../config/configManager.js";

// Lista global para processamento de perigos (Fogo, ácido, etc.)
export const hazards = [];

// ==========================================
// ESTRATÉGIAS DE BALAS (Strategy Pattern)
// Para adicionar novos tiros, basta criar um bloco aqui!
// ==========================================
const bulletBehaviors = {
    normal: {
        update: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    },
    sine: {
        update: (b, dt) => {
            b.baseX += b.vx * dt;
            b.baseY += b.vy * dt;
            let osc = Math.sin(b.lifeTime * 15) * 40;
            b.x = b.baseX + (-b.dirY * osc);
            b.y = b.baseY + (b.dirX * osc);
        },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    },
    boomerang: {
        update: (b, dt) => {
            let progress = b.lifeTime / b.maxLife;
            let angle = progress * Math.PI;
            let dist = Math.sin(angle) * (b.speed * 0.8);
            let lateral = Math.sin(angle * 2) * (b.speed * 0.2);
            b.x = b.startX + (b.dirX * dist) + (-b.dirY * lateral);
            b.y = b.startY + (b.dirY * dist) + (b.dirX * lateral);
        },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    },
    homing: {
        update: (b, dt) => {
            if (b.target && !b.target.dead) {
                let tx = b.target.x - b.x; 
                let ty = b.target.y - b.y;
                let tLenSq = tx * tx + ty * ty;
                if (tLenSq > 0) {
                    let tLen = Math.sqrt(tLenSq);
                    let turnSpeed = 0.05;
                    b.dirX = b.dirX * (1 - turnSpeed) + (tx / tLen) * turnSpeed;
                    b.dirY = b.dirY * (1 - turnSpeed) + (ty / tLen) * turnSpeed;
                    let n = Math.sqrt(b.dirX * b.dirX + b.dirY * b.dirY);
                    b.dirX /= n; b.dirY /= n;
                    b.vx = b.dirX * b.speed; b.vy = b.dirY * b.speed;
                }
            }
            b.x += b.vx * dt; b.y += b.vy * dt;
        },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    },
    drone: {
        update: (b, dt) => {
            if (b.target && !b.target.dead) {
                let tx = b.target.x - b.x; 
                let ty = b.target.y - b.y;
                let tLenSq = tx * tx + ty * ty;
                if (tLenSq > 0) {
                    let tLen = Math.sqrt(tLenSq);
                    let turnSpeed = 0.02;
                    b.dirX = b.dirX * (1 - turnSpeed) + (tx / tLen) * turnSpeed;
                    b.dirY = b.dirY * (1 - turnSpeed) + (ty / tLen) * turnSpeed;
                    let n = Math.sqrt(b.dirX * b.dirX + b.dirY * b.dirY);
                    b.dirX /= n; b.dirY /= n;
                    b.vx = b.dirX * b.speed; b.vy = b.dirY * b.speed;
                }
            }
            b.x += b.vx * dt; b.y += b.vy * dt;
        },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => {
            b.dead = true;
            hazards.push(new Hazard(b.x, b.y, 70, 0.6, b.damage * 3, 'explosion'));
        }
    },
    fire: {
        update: (b, dt) => {
            b.x += b.vx * dt; 
            b.y += b.vy * dt;
            b.trailTimer += dt;
            // OTIMIZAÇÃO: Aumentado de 0.1s para 0.3s para evitar sobrecarga de Garbage Collection (Lag)
            if (b.trailTimer > 0.3) {
                hazards.push(new Hazard(b.x, b.y, 12, 1.5, b.damage * 0.3, 'fire'));
                b.trailTimer = 0;
            }
        },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    },
    rubber: {
        update: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; },
        onHit: (b, target) => {
            b.bounces++;
            b.speed *= 1.25; 
            b.damage *= 1.3;
            let nx = b.x - target.x; 
            let ny = b.y - target.y;
            let nlSq = nx * nx + ny * ny;
            if (nlSq > 0) {
                let nl = Math.sqrt(nlSq);
                b.dirX = nx / nl; b.dirY = ny / nl;
                b.vx = b.dirX * b.speed; b.vy = b.dirY * b.speed;
            }
            if (b.bounces > 3) b.dead = true;
        },
        onTimeout: (b) => { b.dead = true; }
    },
    mine: {
        update: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; },
        onHit: (b, target) => {
            hazards.push(new Hazard(b.x, b.y, 60, 0.5, b.damage * 2, 'explosion'));
            b.dead = true;
        },
        onTimeout: (b) => { b.dead = true; }
    },
    time_bomb: {
        update: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => {
            b.dead = true;
            hazards.push(new Hazard(b.x, b.y, 70, 0.6, b.damage * 3, 'explosion'));
        }
    },
    invisible: {
        update: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; },
        onHit: (b, target) => { b.dead = true; },
        onTimeout: (b) => { b.dead = true; }
    }
};

export class Bullet {
    constructor(x, y, dirX, dirY, baseSpeed, baseDamage, owner = 'player', type = 'normal', target = null) {
        const config = gameData.bullets[type] || gameData.bullets.normal;
        
        this.x = x; this.y = y;
        this.dirX = dirX; this.dirY = dirY;
        this.type = type;
        this.owner = owner;
        this.target = target;
        this.dead = false;
        this.lifeTime = 0;
        
        // Define tempo de vida baseado no tipo
        if (type === 'time_bomb') {
            this.maxLife = owner === 'player' ? 5 : 3;
        } else if (type === 'drone') {
            this.maxLife = 60;
        } else {
            this.maxLife = config.maxLife || (owner === 'player' ? 3 : 2);
        }
        
        this.speed = baseSpeed * (config.speedMult || 1);
        this.damage = baseDamage * (config.damageMult || 1);
        this.radius = config.radius || 5;
        this.color = config.color || "white";

        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;

        // Associa o comportamento correto via Strategy Pattern
        this.behavior = bulletBehaviors[type] || bulletBehaviors.normal;

        this.startX = x; this.startY = y;
        this.baseX = x; this.baseY = y;
        this.bounces = 0;
        this.trailTimer = 0;
    }

    update(dt) {
        this.lifeTime += dt;
        if (this.lifeTime >= this.maxLife) {
            this.behavior.onTimeout(this);
            return;
        }
        this.behavior.update(this, dt);
    }

    onHit(target) {
        this.behavior.onHit(this, target);
    }

    draw(ctx, camera, playerPos) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;
        let alpha = 1;
        
        if (this.type === 'invisible' && playerPos) {
            let dx = this.x - playerPos.x;
            let dy = this.y - playerPos.y;
            let d = Math.sqrt(dx * dx + dy * dy);
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

// ==========================================
// LANÇAMENTOS (Balística Real)
// ==========================================
export class LobbedProjectile {
    constructor(x, y, targetX, targetY, type = 'bomb', baseDamage) {
        const config = gameData.bullets[type] || gameData.bullets.bomb;
        
        this.startX = x; this.startY = y;
        this.targetX = targetX; this.targetY = targetY;
        this.x = x; this.y = y; this.z = 0;
        
        this.type = type;
        this.damage = baseDamage * (config.damageMult || 1);
        this.lifeTime = 0;
        this.dead = false;

        // FÍSICA CORRIGIDA: Tempo de voo agora depende da distância (velocidade constante de ~400px/s)
        let dx = targetX - x;
        let dy = targetY - y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        this.flightTime = Math.max(0.5, dist / 400); 
    }

    update(dt) {
        this.lifeTime += dt;
        let p = this.lifeTime / this.flightTime;
        if (p >= 1) { this.land(); return; }
        
        this.x = this.startX + (this.targetX - this.startX) * p;
        this.y = this.startY + (this.targetY - this.startY) * p;
        
        // FÍSICA CORRIGIDA: Equação de parábola real (Pico de 150px de altura)
        this.z = 4 * 150 * p * (1 - p); 
    }

    land() {
        this.dead = true;
        // Centralizado usando dicionário em vez de switch
        const hazardConfigs = {
            acid: { r: 45, life: 3, dmg: this.damage * 0.4 },
            bomb: { r: 65, life: 0.5, dmg: this.damage * 2.5 },
            glue: { r: 55, life: 4, dmg: 1 },
            quicker: { r: 30, life: 0.3, dmg: this.damage }
        };
        let h = hazardConfigs[this.type] || hazardConfigs.bomb;
        hazards.push(new Hazard(this.targetX, this.targetY, h.r, h.life, h.dmg, this.type));
    }

    draw(ctx, camera) {
        let dx = this.x - camera.x;
        let dy = (this.y - this.z) - camera.y; // Subtrai o Z para dar ilusão de altura 3D
        
        // Sombra no chão que encolhe/enfraquece conforme a altura aumenta
        let shadowScale = Math.max(0.2, 1 - (this.z / 150));
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); 
        ctx.arc(this.x - camera.x, this.y - camera.y, 8 * shadowScale, 0, Math.PI*2); 
        ctx.fill();
        
        ctx.fillStyle = this.type === 'acid' ? 'lime' : 'white';
        ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI*2); ctx.fill();
    }
}

// ==========================================
// HAZARDS (Efeitos de Solo)
// ==========================================
export class Hazard {
    constructor(x, y, radius, life, dmg, type) {
        this.x = x; this.y = y; this.radius = radius;
        this.maxLife = life; this.lifeTime = 0;
        this.damage = dmg; this.type = type;
        this.dead = false; 
        
        this.tickTimer = 0;
        this.isDamageTick = false; // FLAG CORRIGIDA: Garante dano justo a todos no mesmo frame
    }
    
    update(dt) {
        this.lifeTime += dt;
        this.tickTimer += dt;
        this.isDamageTick = false;

        // O Hazard agora controla globalmente o pulso de dano a cada 0.4s
        if (this.tickTimer > 0.4) {
            this.isDamageTick = true;
            this.tickTimer = 0;
        }

        if (this.lifeTime >= this.maxLife) this.dead = true;
    }

    canDamage() {
        // Retorna a flag estática para o frame atual, sem zerar variáveis internas
        return this.isDamageTick; 
    }

    draw(ctx, camera) {
        let dx = this.x - camera.x;
        let dy = this.y - camera.y;
        let a = 1 - (this.lifeTime / this.maxLife);
        ctx.globalAlpha = a * 0.5;
        
        const colors = { fire: 'orange', acid: 'lime', glue: 'brown', explosion: 'yellow' };
        ctx.fillStyle = colors[this.type] || 'white';
                       
        ctx.beginPath(); ctx.arc(dx, dy, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Pool de munições especiais derivada dinamicamente.
 */
export function getSpecialBulletsPool() {
    if (!gameData || !gameData.bullets) return [];
    return Object.keys(gameData.bullets).filter(key => key !== 'normal');
}
