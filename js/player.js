import { input } from "./main.js";
import { Bullet, LobbedProjectile, SPECIAL_BULLETS_POOL } from "./bullet.js";

// Catálogo de Upgrades Base (Status em Inglês)
const BASE_UPGRADES = [
    { id: 'speed', name: 'Light Boots', desc: '+15% Move Speed', apply: (p) => p.speed *= 1.15 },
    { id: 'fireRate', name: 'Fast Trigger', desc: 'Shoot 20% faster', apply: (p) => p.fireRate *= 0.8 },
    { id: 'damage', name: 'Piercing Ammo', desc: '+10 Base Damage', apply: (p) => p.damage += 10 },
    { id: 'multishot', name: 'Multishot', desc: '+1 Bullet per shot', apply: (p) => p.multiShot += 1 },
    { id: 'maxHp', name: 'Iron Heart', desc: '+50 Max HP & Full Heal', apply: (p) => { p.maxHp += 50; p.hp = p.maxHp; } },
    { id: 'bulletSpeed', name: 'Extra Powder', desc: '+25% Bullet Speed', apply: (p) => p.bulletSpeed *= 1.25 },
    { id: 'heal', name: 'Medkit', desc: 'Heal 50% HP', apply: (p) => p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.5)) }
];

export class Player {
    constructor(x, y) {
        // Posição e Físicas
        this.x = x;
        this.y = y;
        this.radius = 20;

        // Novas variáveis de Física (Inércia)
        this.velX = 0;
        this.velY = 0;
        this.acceleration = 1200; // Força de arranque
        this.friction = 0.85;     // Atrito (0.85 cria um efeito de deslize suave)
        
        // Status Base
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.speed = 1;               // Agora atua como multiplicador da aceleração
        this.speedMultiplicador = 1.0; // Usado para debuffs externos
        this.damage = 35;
        this.fireRate = 0.6;
        this.bulletSpeed = 450;
        this.multiShot = 1;
        this.currentBulletType = 'normal'; // Atualizado conforme instrução

        // Controle de disparo e arsenal
        this.shootTimer = 0;
        this.bullets = [];

        // Sistema de Progressão (XP)
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null; 
    }

    update(dt) {
        // 1. Movimento com Física (Inércia)
        let currentAccel = this.acceleration * this.speed * this.speedMultiplicador;
        
        // Adiciona aceleração baseada na inclinação do joystick
        this.velX += input.move.x * currentAccel * dt;
        this.velY += input.move.y * currentAccel * dt;

        // Aplica o atrito para o personagem não deslizar infinitamente
        this.velX *= this.friction;
        this.velY *= this.friction;

        // Atualiza a posição baseada na velocidade resultante
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 2. Cooldown de Tiro
        if (this.shootTimer > 0) {
            this.shootTimer -= dt;
        }

        // 3. Lógica de Atirar
        if (input.isShooting && this.shootTimer <= 0) {
            this.shoot(input.aim.x, input.aim.y);
            this.shootTimer = this.fireRate;
        }

        // 4. Atualizar projéteis
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.update(dt, { x: this.x, y: this.y }); 
            if (b.dead || (b.lifeTime !== undefined && b.lifeTime > 10)) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot(dirX, dirY) {
        let baseAngle = Math.atan2(dirY, dirX);
        let spread = 15 * (Math.PI / 180);
        let startAngle = baseAngle - (spread * (this.multiShot - 1)) / 2;

        const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
        const isLobbed = lobbedTypes.includes(this.currentBulletType);
        const throwDistance = 350; 

        for (let i = 0; i < this.multiShot; i++) {
            let angle = startAngle + (i * spread);
            let vx = Math.cos(angle);
            let vy = Math.sin(angle);

            if (isLobbed) {
                let targetX = this.x + (vx * throwDistance);
                let targetY = this.y + (vy * throwDistance);
                this.bullets.push(new LobbedProjectile(this.x, this.y, targetX, targetY, this.currentBulletType, this.damage));
            } else {
                this.bullets.push(new Bullet(this.x, this.y, vx, vy, this.bulletSpeed, this.damage, 'player', this.currentBulletType));
            }
        }
    }

    gainXp(amount) {
        this.xp += amount;
        while (this.xp >= this.xpNeeded) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpNeeded;
        this.xpNeeded = Math.floor(this.xpNeeded * 1.25);

        let choices = [];
        let shuffledBase = [...BASE_UPGRADES].sort(() => 0.5 - Math.random());

        if (Math.random() <= 0.25) {
            let randomSpecial = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
            choices.push({
                id: 'bullet_' + randomSpecial,
                name: 'Ammo: ' + randomSpecial.toUpperCase(),
                desc: 'Change your shots to ' + randomSpecial,
                apply: (p) => p.currentBulletType = randomSpecial
            });
            choices.push(...shuffledBase.slice(0, 3));
        } else {
            choices.push(...shuffledBase.slice(0, 4));
        }

        if (this.onLevelUp) this.onLevelUp(choices);
    }

    applyUpgrade(upgradeId) {
        if (upgradeId.startsWith('bullet_')) {
            this.currentBulletType = upgradeId.replace('bullet_', '');
            return;
        }
        const upgrade = BASE_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) upgrade.apply(this);
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        for (let b of this.bullets) {
            b.draw(ctx, camera, {x: this.x, y: this.y});
        }

        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        if (input.isShooting) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + input.aim.x * 60, drawY + input.aim.y * 60);
            ctx.stroke();
        }

        // Barra de Vida
        let hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillRect(drawX - 25, drawY + 30, 50, 6);
        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        ctx.fillRect(drawX - 25, drawY + 30, 50 * hpRatio, 6);

        // Barra de XP
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
