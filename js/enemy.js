import { Bullet, LobbedProjectile } from "./bullet.js";
import { getSmartAim } from "./predict.js";

export class Enemy {
    constructor(x, y, aiType = 'aggressive', bulletType = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.dead = false;

        this.maxHp = Math.floor(Math.random() * 401) + 100;
        this.hp = this.maxHp;
        
        this.aiType = aiType;
        this.bulletType = bulletType;
        
        // Física de Inércia dos inimigos
        this.velX = 0;
        this.velY = 0;
        this.acceleration = 800;
        this.friction = 0.85;
        this.meleeCooldown = 0; // Cooldown de dano corpo-a-corpo

        this.bullets = [];
        this.target = null;

        this.shootCooldown = 0;
        this.fireRate = 1.5;
        this.timeSinceLastDamage = 0;
        this.timeSinceLastShot = 0;

        this.randomMoveDir = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        this.randomMoveTimer = 0;
        this.dodgeVector = { x: 0, y: 0 };
        this.dodgeTimer = 0;

        this.aplicarAtributosPorIA();
    }

    aplicarAtributosPorIA() {
        switch (this.aiType) {
            case 'sniper':
                this.acceleration = 500;
                this.fireRate = 2.5;
                break;
            case 'melee':
                this.acceleration = 1400;
                this.maxHp = 100;
                this.hp = this.maxHp;
                break;
            case 'healer':
                this.acceleration = 1000;
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.timeSinceLastDamage = 0;
        if (this.hp <= 0) {
            this.dead = true;
        }
    }

    update(dt, player, allEnemies, allBullets) {
        if (this.dead) return;

        this.timeSinceLastDamage += dt;
        this.timeSinceLastShot += dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.dodgeTimer > 0) this.dodgeTimer -= dt;
        if (this.meleeCooldown > 0) this.meleeCooldown -= dt;

        // Cura passiva
        if (this.timeSinceLastDamage > 3 && this.timeSinceLastShot > 3) {
            this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.10 * dt));
        }

        this.selecionarAlvo(player, allEnemies);
        this.atualizarMovimento(dt, player, allBullets); 
        this.atualizarTiro();

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.update(dt, player);
            if (b.dead || b.lifeTime > b.maxLife) {
                this.bullets.splice(i, 1);
            }
        }
    }

    selecionarAlvo(player, allEnemies) {
        if (this.aiType === 'healer') {
            this.target = null;
            return;
        }

        let alvoMaisProximo = player;
        let menorDistancia = Math.hypot(player.x - this.x, player.y - this.y);

        for (let outroInimigo of allEnemies) {
            if (outroInimigo === this || outroInimigo.dead) continue;
            
            let dist = Math.hypot(outroInimigo.x - this.x, outroInimigo.y - this.y);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                alvoMaisProximo = outroInimigo;
            }
        }

        this.target = alvoMaisProximo;
    }

    atualizarMovimento(dt, player, allBullets) {
        let moveX = 0;
        let moveY = 0;

        if (this.dodgeTimer <= 0) {
            for (let b of allBullets) {
                if (b.sender === this || b.owner === this) continue;

                let distToBullet = Math.hypot(b.x - this.x, b.y - this.y);
                if (distToBullet < 120) {
                    if (Math.random() < 0.75) {
                        this.dodgeVector = { x: -b.vy, y: b.vx }; 
                        this.dodgeTimer = 0.5;
                    } else {
                        this.dodgeTimer = 0.5; 
                    }
                    break;
                }
            }
        }

        if (this.dodgeTimer > 0 && (this.dodgeVector.x !== 0 || this.dodgeVector.y !== 0)) {
            moveX = this.dodgeVector.x;
            moveY = this.dodgeVector.y;
        } else {
            if (this.aiType === 'lost') {
                this.randomMoveTimer -= dt;
                if (this.randomMoveTimer <= 0) {
                    let angle = Math.random() * Math.PI * 2;
                    this.randomMoveDir = { x: Math.cos(angle), y: Math.sin(angle) };
                    this.randomMoveTimer = 1 + Math.random() * 2;
                }
                moveX = this.randomMoveDir.x;
                moveY = this.randomMoveDir.y;
            } 
            else if (this.aiType === 'healer') {
                let angleToPlayer = Math.atan2(this.y - player.y, this.x - player.x);
                moveX = Math.cos(angleToPlayer);
                moveY = Math.sin(angleToPlayer);
            }
            else if (this.target) {
                let dx = this.target.x - this.x;
                let dy = this.target.y - this.y;
                let distToTarget = Math.hypot(dx, dy);
                let dirX = distToTarget === 0 ? 0 : dx / distToTarget;
                let dirY = distToTarget === 0 ? 0 : dy / distToTarget;

                switch (this.aiType) {
                    case 'aggressive':
                    case 'melee':
                        moveX = dirX;
                        moveY = dirY;
                        break;
                    case 'sniper':
                        if (distToTarget < 400) {
                            moveX = -dirX;
                            moveY = -dirY;
                        } else if (distToTarget > 600) {
                            moveX = dirX;
                            moveY = dirY;
                        }
                        break;
                    case 'strategic':
                        if (distToTarget < 200) {
                            moveX = -dirX;
                            moveY = -dirY;
                        } else if (distToTarget > 300) {
                            moveX = dirX;
                            moveY = dirY;
                        } else {
                            moveX = -dirY; 
                            moveY = dirX;
                        }
                        break;
                }
            }
        }

        // Normalização do vetor de direção
        let length = Math.hypot(moveX, moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }

        // Aplicação da Física de Inércia
        this.velX += moveX * this.acceleration * dt;
        this.velY += moveY * this.acceleration * dt;

        this.velX *= this.friction;
        this.velY *= this.friction;

        this.x += this.velX * dt;
        this.y += this.velY * dt;
    }

    atualizarTiro() {
        if (this.aiType === 'melee' || this.aiType === 'healer' || !this.target) return;

        let dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (this.shootCooldown > 0 || dist > 800) return;

        let bulletSpeed = 300;
        let baseDamage = 25;
        let targetVel = { x: this.target.velX || 0, y: this.target.velY || 0 };

        let aim = getSmartAim(
            { x: this.x, y: this.y },
            { x: this.target.x, y: this.target.y },
            targetVel,
            bulletSpeed,
            this.bulletType,
            this.target.radius || 20
        );

        if (!aim) return;

        const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
        if (lobbedTypes.includes(this.bulletType)) {
            this.bullets.push(new LobbedProjectile(
                this.x, this.y, 
                aim.targetX, aim.targetY, 
                this.bulletType, baseDamage
            ));
        } else {
            let newBullet = new Bullet(
                this.x, this.y, 
                aim.x, aim.y, 
                bulletSpeed, baseDamage, 
                'enemy', this.bulletType, this.target
            );
            newBullet.sender = this;
            this.bullets.push(newBullet);
        }

        this.shootCooldown = this.fireRate;
        this.timeSinceLastShot = 0;
    }

    draw(ctx, camera, player) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        for (let b of this.bullets) {
            b.draw(ctx, camera, player); 
        }

        ctx.fillStyle = this.getCorPorIA();
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        if (this.target) {
            let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(drawX + Math.cos(angle)*10, drawY + Math.sin(angle)*10, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        let hpRatio = this.hp / this.maxHp;
        ctx.fillStyle = "red";
        ctx.fillRect(drawX - 20, drawY - 35, 40, 5);
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(drawX - 20, drawY - 35, 40 * hpRatio, 5);
    }

    getCorPorIA() {
        switch(this.aiType) {
            case 'aggressive': return '#ff3333';
            case 'sniper': return '#cc00ff';
            case 'strategic': return '#ffaa00';
            case 'melee': return '#880000';
            case 'healer': return '#00ff88';
            case 'lost': return '#888888';
            default: return 'red';
        }
    }
}
