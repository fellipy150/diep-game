import { Bullet, LobbedProjectile } from "./bullet.js";
import { getSmartAim } from "./predict.js";
import { gameData } from "./configManager.js";

// ==========================================
// ESTRATÉGIAS DE IA (Strategy Pattern)
// ==========================================
const aiBehaviors = {
    lost: {
        think: (enemy, dt, player, allEnemies) => {
            // IA 'Lost' agora busca alvos dinamicamente
            if (enemy.targetUpdateTimer <= 0) {
                enemy.shootTarget = enemy.selecionarAlvoOtimizado(player, allEnemies);
                enemy.targetUpdateTimer = 1.0;
            }

            enemy.randomMoveTimer -= dt;
            if (enemy.randomMoveTimer <= 0) {
                let angle = Math.random() * Math.PI * 2;
                enemy.randomMoveDir = { x: Math.cos(angle), y: Math.sin(angle) };
                enemy.randomMoveTimer = 1 + Math.random() * 2;
            }
            return enemy.randomMoveDir;
        },
        drawShape: (ctx, r) => { 
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
        }
    },
    aggressive: {
        think: (enemy, dt, player, allEnemies) => {
            enemy.shootTarget = enemy.selecionarAlvoOtimizado(player, allEnemies);
            if (!enemy.shootTarget) return { x: 0, y: 0 };
            
            const dx = enemy.shootTarget.x - enemy.x;
            const dy = enemy.shootTarget.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            return { x: dx / dist, y: dy / dist };
        },
        drawShape: (ctx, r) => { 
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
        }
    },
    tactical: {
        think: (enemy, dt, player, allEnemies) => {
            if (enemy.targetUpdateTimer <= 0) {
                enemy.shootTarget = enemy.selecionarAlvoOtimizado(player, allEnemies);
                enemy.targetUpdateTimer = 1.0;
            }
            if (!enemy.shootTarget) return { x: 0, y: 0 };
            
            const dx = enemy.shootTarget.x - enemy.x;
            const dy = enemy.shootTarget.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 1;
            
            if (distSq > 160000) return { x: dx / dist, y: dy / dist };
            if (distSq < 40000) return { x: -dx / dist, y: -dy / dist };
            return { x: -dy / dist, y: dx / dist };
        },
        drawShape: (ctx, r) => {
            ctx.beginPath();
            ctx.moveTo(0, -r); ctx.lineTo(r, r/2); ctx.lineTo(-r, r/2);
            ctx.closePath();
        }
    },
    sniper: {
        think: (enemy, dt, player, allEnemies) => {
            // Sniper agora também escolhe o alvo dinamicamente
            if (enemy.targetUpdateTimer <= 0) {
                enemy.shootTarget = enemy.selecionarAlvoOtimizado(player, allEnemies);
                enemy.targetUpdateTimer = 1.0;
            }

            if (!enemy.shootTarget) return { x: 0, y: 0 };

            const dx = enemy.shootTarget.x - enemy.x;
            const dy = enemy.shootTarget.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 1;
            
            if (distSq < 160000) return { x: -dx / dist, y: -dy / dist }; 
            if (distSq > 360000) return { x: dx / dist, y: dy / dist };  
            return { x: 0, y: 0 }; 
        },
        drawShape: (ctx, r) => {
            ctx.beginPath();
            ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
            ctx.closePath();
        }
    }
};

export class Enemy {
    constructor(x, y, aiType = 'aggressive', bulletType = 'normal') {
        const config = gameData.enemies.aiTypes[aiType] || gameData.enemies.aiTypes['lost'];
        
        this.x = x; this.y = y;
        this.radius = 25;
        this.dead = false;
        
        this.aiType = aiType;
        this.bulletType = bulletType;
        this.color = config.color;
        this.behavior = aiBehaviors[aiType] || aiBehaviors['aggressive']; 
        
        const [minHp, maxHp] = config.hpRange;
        this.maxHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
        this.hp = this.maxHp;
        
        this.velX = 0; this.velY = 0;
        this.acceleration = 800 * (config.accelMult || 1.0);
        this.friction = 0.85;
        
        this.bullets = [];
        this.shootTarget = null;
        this.targetUpdateTimer = 0; 
        this.shootCooldown = 0;
        this.fireRate = config.fireRate || 1.5;
        this.meleeCooldown = 0;

        this.timeSinceLastDamage = 0;
        this.timeSinceLastShot = 0;
        
        this.randomMoveDir = { x: 0, y: 0 };
        this.randomMoveTimer = 0;
        this.dodgeVector = { x: 0, y: 0 };
        this.dodgeTimer = 0;
        this.dodgeCheckTimer = 0;
        this.efeitoColaTimer = 0;
        this.speedMultiplicador = 1.0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.timeSinceLastDamage = 0;
        if (this.hp <= 0) this.dead = true;
    }

    update(dt, player, allEnemies, threatBullets) {
        if (this.dead) return;

        this.timeSinceLastDamage += dt;
        this.timeSinceLastShot += dt;
        this.targetUpdateTimer -= dt;
        this.dodgeCheckTimer -= dt;
        this.shootCooldown -= dt;
        this.dodgeTimer -= dt;
        this.meleeCooldown -= dt;

        if (this.timeSinceLastDamage > 3 && this.timeSinceLastShot > 3) {
            this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.10 * dt));
        }

        const intention = this.behavior.think(this, dt, player, allEnemies);
        let moveX = intention.x;
        let moveY = intention.y;

        this.processarEsquiva(threatBullets);
        if (this.dodgeTimer > 0) {
            moveX = this.dodgeVector.x;
            moveY = this.dodgeVector.y;
        }

        let speedFinal = this.acceleration * this.speedMultiplicador;
        this.velX += moveX * speedFinal * dt;
        this.velY += moveY * speedFinal * dt;
        this.velX *= this.friction;
        this.velY *= this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        this.atualizarTiro();

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt, player);
            if (this.bullets[i].dead) this.bullets.splice(i, 1);
        }
    }

    processarEsquiva(threatBullets) {
        if (!threatBullets || this.dodgeCheckTimer > 0) return;
        this.dodgeCheckTimer = 0.2;

        for (let b of threatBullets) {
            if (b.sender === this || b.owner === this) continue;
            let bdx = b.x - this.x; 
            let bdy = b.y - this.y;
            if ((bdx * bdx + bdy * bdy) < 14400) {
                this.dodgeVector = { x: -b.vy, y: b.vx };
                this.dodgeTimer = 0.5;
                break;
            }
        }
    }

    selecionarAlvoOtimizado(player, allEnemies) {
        let alvo = null;
        let menorDistSq = Infinity; 
        
        // 1. Avalia outros inimigos primeiro
        for (let outro of allEnemies) {
            if (outro === this || outro.dead) continue;
            
            let dEx = outro.x - this.x;
            let dEy = outro.y - this.y;
            let distSq = dEx * dEx + dEy * dEy;
            
            if (distSq < menorDistSq) {
                menorDistSq = distSq;
                alvo = outro;
            }
        }

        // 2. Avalia o Player com bônus de furtividade (1.5x distância aparente)
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let distPlayerSq = (dx * dx + dy * dy) * 1.5; 
        
        if (distPlayerSq < menorDistSq) {
            alvo = player;
        }

        return alvo;
    }

    atualizarTiro() {
        if (!this.shootTarget || this.shootTarget.dead || this.shootCooldown > 0) return;

        let dx = this.shootTarget.x - this.x; 
        let dy = this.shootTarget.y - this.y;
        if (dx * dx + dy * dy > 640000) return;

        let bulletSpeed = 300;
        let targetVel = { x: this.shootTarget.velX || 0, y: this.shootTarget.velY || 0 };

        let aim = getSmartAim({ x: this.x, y: this.y }, { x: this.shootTarget.x, y: this.shootTarget.y }, targetVel, bulletSpeed, this.bulletType, this.shootTarget.radius || 20);
        if (!aim) return;

        const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
        if (lobbedTypes.includes(this.bulletType)) {
            this.bullets.push(new LobbedProjectile(this.x, this.y, aim.targetX, aim.targetY, this.bulletType, 25));
        } else {
            let newBullet = new Bullet(this.x, this.y, aim.x, aim.y, bulletSpeed, 25, 'enemy', this.bulletType, this.shootTarget);
            newBullet.sender = this;
            this.bullets.push(newBullet);
        }

        this.shootCooldown = this.fireRate;
        this.timeSinceLastShot = 0;
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        for (let b of this.bullets) b.draw(ctx, camera); 

        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(drawX, drawY); 
        this.behavior.drawShape(ctx, this.radius);
        ctx.fill();
        ctx.restore();

        if (this.shootTarget) {
            let angle = Math.atan2(this.shootTarget.y - this.y, this.shootTarget.x - this.x);
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(drawX + Math.cos(angle) * 10, drawY + Math.sin(angle) * 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.hp < this.maxHp) {
            let hpRatio = this.hp / this.maxHp;
            ctx.fillStyle = "red";
            ctx.fillRect(drawX - 20, drawY - 35, 40, 5);
            ctx.fillStyle = "lightgreen";
            ctx.fillRect(drawX - 20, drawY - 35, 40 * hpRatio, 5);
        }
    }
}
