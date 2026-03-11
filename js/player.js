import { input } from "./main.js";
import { gameData } from "./configManager.js";
import { Bullet, LobbedProjectile, SPECIAL_BULLETS_POOL } from "./bullet.js";

export class Player {
    constructor(x, y) {
        // Posição e Físicas
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.radius = 20;
        this.acceleration = 1400;
        this.friction = 0.88;
        
        // Status Base
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.speed = 1.0; 
        this.speedMultiplicador = 1.0;
        this.damage = 40;
        this.fireRate = 0.6; 
        this.bulletSpeed = 500;
        this.multiShot = 1;
        this.currentBulletType = 'normal';

        // Sistema de Upgrades e Sinergias (Persistência de Dados)
        this.upgradeCounts = {}; 
        this.activeSynergies = []; 
        
        // Controle de disparo
        this.shootTimer = 0;
        this.bullets = [];

        // Sistema de Progressão
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
    }

    update(dt) {
        // 1. Movimento com Inércia
        let acc = this.acceleration * this.speed * this.speedMultiplicador;
        this.velX += input.move.x * acc * dt;
        this.velY += input.move.y * acc * dt;
        this.velX *= this.friction;
        this.velY *= this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 2. Cooldown de Tiro Dinâmico (Lido do gameData carregado)
        const config = gameData.bullets[this.currentBulletType] || gameData.bullets['normal'];
        let effectiveFireRate = this.fireRate * (config.fireRateMult || 1);

        if (this.shootTimer > 0) this.shootTimer -= dt;

        // 3. Disparo Automático
        if (input.isShooting && this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = effectiveFireRate;
        }

        // 4. Atualizar Balas
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt, { x: this.x, y: this.y });
            if (this.bullets[i].dead) this.bullets.splice(i, 1);
        }
    }

    shoot() {
        const config = gameData.bullets[this.currentBulletType] || gameData.bullets['normal'];
        let baseAngle = Math.atan2(input.aim.y, input.aim.x);
        
        // Lógica de escalonamento de tiros
        let shotCount = 1;
        if (config.multishotScale === 0) shotCount = 1;
        else shotCount = Math.max(1, Math.round(this.multiShot * config.multishotScale));

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
            this.level++;
            this.xp -= this.xpNeeded;
            this.xpNeeded = Math.floor(this.xpNeeded * 1.3);
            if (this.onLevelUp) this.onLevelUp(this.generateUpgrades());
        }
    }

    generateUpgrades() {
        let choices = [];
        // Sorteia opções diretamente do catálogo JSON
        let shuffledBase = [...gameData.upgrades.statUpgrades].sort(() => 0.5 - Math.random());

        // 25% de chance de oferecer munição especial
        if (Math.random() <= 0.25) {
            let randomSpecial = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
            choices.push({
                id: 'bullet_' + randomSpecial,
                name: 'Ammo: ' + randomSpecial.toUpperCase(),
                desc: 'Change your weapon type',
                isWeapon: true
            });
            choices.push(...shuffledBase.slice(0, 3));
        } else {
            choices.push(...shuffledBase.slice(0, 4));
        }
        return choices;
    }

    applyUpgrade(upgradeId) {
        // 1. Troca de Arma
        if (upgradeId.startsWith('bullet_')) {
            this.currentBulletType = upgradeId.replace('bullet_', '');
            this.checkSynergies(); 
            return;
        }

        // 2. Registro e Aplicação de Stats via gameData
        this.upgradeCounts[upgradeId] = (this.upgradeCounts[upgradeId] || 0) + 1;
        const upgrade = gameData.upgrades.statUpgrades.find(u => u.id === upgradeId);
        
        if (upgrade) {
            if (upgrade.type === 'multiply') this[upgrade.stat] *= upgrade.value;
            else if (upgrade.type === 'add') this[upgrade.stat] += upgrade.value;
            
            // Especial: Cura completa ao aumentar HP Máximo
            if (upgradeId === 'maxHp') this.hp = this.maxHp;
        }

        // 3. Verificação de Sinergias
        this.checkSynergies();
    }

    checkSynergies() {
        gameData.synergies.synergies.forEach(syn => {
            // Verifica requisitos: Arma correta + Quantidade de Upgrades
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

        for (let b of this.bullets) b.draw(ctx, camera, { x: this.x, y: this.y });

        // Visual do Jogador
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Aura de Sinergia
        if (this.activeSynergies.length > 0) {
            ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius + 5, 0, Math.PI * 2);
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
