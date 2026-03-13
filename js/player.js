import { input } from "./main.js";
import { gameData } from "./configManager.js";
import { Bullet, LobbedProjectile, getSpecialBulletsPool } from "./bullet.js";

export class Player {
    constructor(x, y) {
        this.x = x; 
        this.y = y;
        this.velX = 0; 
        this.velY = 0;
        this.radius = 20;
        
        // Físicas base
        this.baseAcceleration = 1400;
        this.friction = 0.88;
        
        // Status Base
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.baseSpeed = 1.0; 
        this.damage = 40;
        this.fireRate = 0.6; 
        this.bulletSpeed = 500;
        this.multiShot = 1;
        this.currentBulletType = 'normal';

        // SISTEMA DE STATUS (Buffs / Debuffs)
        this.activeEffects = [];
        this.currentSpeedMult = 1.0; // Recalculado a cada frame

        // Progressão e Upgrades
        this.upgradeCounts = {}; 
        this.activeSynergies = []; 
        
        this.shootTimer = 0;
        this.bullets = [];

        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;

        // Visual (Respeita o pause do jogo)
        this.visualRotation = 0;
    }

    // Método central para receber efeitos do mapa ou de inimigos
    addStatusEffect(type, duration) {
        let existing = this.activeEffects.find(e => e.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration); // Renova a duração
        } else {
            this.activeEffects.push({ type, duration });
        }
    }

    update(dt) {
        // 1. Processar Status Effects
        this.currentSpeedMult = 1.0;
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            let effect = this.activeEffects[i];
            effect.duration -= dt;
            
            // Aplica as regras do debuff/buff
            if (effect.type === 'glue') this.currentSpeedMult *= 0.3;
            // Exemplo para o futuro: if (effect.type === 'poison') this.hp -= 5 * dt;

            if (effect.duration <= 0) this.activeEffects.splice(i, 1);
        }

        // 2. Movimento Seguro (Prevenindo Exploit de Velocidade Diagonal)
        let dirX = input.move.x;
        let dirY = input.move.y;
        let magSq = dirX * dirX + dirY * dirY;
        
        if (magSq > 1) {
            let mag = Math.sqrt(magSq);
            dirX /= mag; 
            dirY /= mag;
        }

        let acc = this.baseAcceleration * this.baseSpeed * this.currentSpeedMult;
        this.velX += dirX * acc * dt;
        this.velY += dirY * acc * dt;
        this.velX *= this.friction;
        this.velY *= this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 3. Atualizar Visual (Respeitando o Pause)
        this.visualRotation += dt * 5;

        // 4. Combate
        const config = gameData.bullets[this.currentBulletType] || gameData.bullets['normal'];
        let effectiveFireRate = this.fireRate * (config.fireRateMult || 1);

        if (this.shootTimer > 0) this.shootTimer -= dt;

        if (input.isShooting && this.shootTimer <= 0) {
            this.shoot(config);
            this.shootTimer = effectiveFireRate;
        }

        // 5. Atualizar Balas IN-PLACE
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt);
            if (this.bullets[i].dead) this.bullets.splice(i, 1);
        }
    }

    shoot(config) {
        let baseAngle = Math.atan2(input.aim.y, input.aim.x);
        let shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(this.multiShot * config.multishotScale));

        let spread = (15 * Math.PI / 180);
        let startAngle = baseAngle - (spread * (shotCount - 1)) / 2;

        for (let i = 0; i < shotCount; i++) {
            let ang = startAngle + (i * spread);
            let vx = Math.cos(ang), vy = Math.sin(ang);

            if (config.type === 'lobbed') {
                this.bullets.push(new LobbedProjectile(this.x, this.y, this.x + vx * 400, this.y + vy * 400, this.currentBulletType, this.damage));
            } else {
                this.bullets.push(new Bullet(this.x, this.y, vx, vy, this.bulletSpeed, this.damage, 'player', this.currentBulletType));
            }
        }
    }

    gainXp(amt) {
        this.xp += amt;
        while (this.xp >= this.xpNeeded) {
            this.levelUp(); 
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpNeeded;
        this.xpNeeded = Math.floor(this.xpNeeded * 1.25);

        let choices = [];
        const baseUpgrades = gameData.upgrades.statUpgrades;
        let shuffledBase = [...baseUpgrades].sort(() => 0.5 - Math.random());

        if (Math.random() <= 0.25) {
            const pool = getSpecialBulletsPool();
            if (pool.length > 0) {
                let randomSpecial = pool[Math.floor(Math.random() * pool.length)];
                choices.push({
                    id: 'bullet_' + randomSpecial,
                    name: 'Ammo: ' + randomSpecial.toUpperCase(),
                    description: 'Changes your primary weapon to ' + randomSpecial.toUpperCase(),
                    type: 'weapon'
                });
                choices.push(...shuffledBase.slice(0, 3));
            } else {
                choices.push(...shuffledBase.slice(0, 4));
            }
        } else {
            choices.push(...shuffledBase.slice(0, 4));
        }

        if (this.onLevelUp) this.onLevelUp(choices);
    }

    applyUpgrade(upgradeId) {
        if (upgradeId.startsWith('bullet_')) {
            this.currentBulletType = upgradeId.replace('bullet_', '');
            this.checkSynergies(); 
            return;
        }

        this.upgradeCounts[upgradeId] = (this.upgradeCounts[upgradeId] || 0) + 1;
        const upgrade = gameData.upgrades.statUpgrades.find(u => u.id === upgradeId);
        
        if (upgrade) {
            if (upgrade.type === 'multiply') this[upgrade.stat] *= upgrade.value;
            else if (upgrade.type === 'add') this[upgrade.stat] += upgrade.value;
            
            if (upgradeId === 'maxHp') this.hp += upgrade.value; 
        }

        this.checkSynergies();
    }

    checkSynergies() {
        gameData.synergies.synergies.forEach(syn => {
            if (!this.activeSynergies.includes(syn.id) && this.currentBulletType === syn.requiredBullet) {
                const metRequirements = Object.keys(syn.requiredUpgrades).every(reqId => 
                    (this.upgradeCounts[reqId] || 0) >= syn.requiredUpgrades[reqId]
                );

                if (metRequirements) {
                    this.activeSynergies.push(syn.id);
                    console.log("%c SYNERGY UNLOCKED: " + syn.name, "color: #ff0; font-weight: bold; font-size: 14px;");
                }
            }
        });
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        // 1. Projéteis
        for (let b of this.bullets) b.draw(ctx, camera, { x: this.x, y: this.y });

        // 2. Brilho Ciano (Substituindo shadowBlur por Gradiente GPU-friendly)
        let grad = ctx.createRadialGradient(drawX, drawY, this.radius - 10, drawX, drawY, this.radius + 15);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, "cyan");
        grad.addColorStop(1, "transparent");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius + 15, 0, Math.PI * 2);
        ctx.fill();

        // 3. Anel Rotativo (Sincronizado com o dt)
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius + 5, this.visualRotation, this.visualRotation + Math.PI * 1.5);
        ctx.stroke();

        // 4. Núcleo do Jogador
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius - 5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Indicador de Mira
        if (input.aim.x !== 0 || input.aim.y !== 0) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.5)"; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + input.aim.x * 35, drawY + input.aim.y * 35);
            ctx.stroke();
        }

        // 6. Anel de Sinergias Ativas
        if (this.activeSynergies.length > 0) {
            ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius + 13, 0, Math.PI * 2);
            ctx.stroke();
        }

        this.drawBars(ctx, drawX, drawY);
    }

    drawBars(ctx, drawX, drawY) {
        let hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillRect(drawX - 25, drawY + 30, 50, 6);
        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        ctx.fillRect(drawX - 25, drawY + 30, 50 * hpRatio, 6);

        let xpRatio = Math.max(0, this.xp / this.xpNeeded);
        ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
        ctx.fillRect(drawX - 25, drawY + 40, 50, 4);
        ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
        ctx.fillRect(drawX - 25, drawY + 40, 50 * xpRatio, 4);
        
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Lvl ${this.level}`, drawX, drawY + 54);
    }
}
