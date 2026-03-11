import { input } from "./main.js";
import { Bullet, LobbedProjectile, SPECIAL_BULLETS_POOL } from "./bullet.js";

// Catálogo de Upgrades Base (Status)
const BASE_UPGRADES = [
    { id: 'speed', name: 'Botas Leves', desc: '+15% Velocidade de Movimento', apply: (p) => p.speed *= 1.15 },
    { id: 'fireRate', name: 'Gatilho Rápido', desc: 'Atira 20% mais rápido', apply: (p) => p.fireRate *= 0.8 },
    { id: 'damage', name: 'Munição Perfurante', desc: '+10 de Dano base', apply: (p) => p.damage += 10 },
    { id: 'multishot', name: 'Tiro Múltiplo', desc: '+1 Projétil por tiro', apply: (p) => p.multiShot += 1 },
    { id: 'maxHp', name: 'Coração de Ferro', desc: '+50 Vida Máxima e Cura total', apply: (p) => { p.maxHp += 50; p.hp = p.maxHp; } },
    { id: 'bulletSpeed', name: 'Pólvora Extra', desc: '+25% Velocidade do Tiro', apply: (p) => p.bulletSpeed *= 1.25 },
    { id: 'heal', name: 'Kit de Primeiros Socorros', desc: 'Recupera 50% da Vida', apply: (p) => p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.5)) }
];

export class Player {
    constructor(x, y) {
        // Posição e Físicas
        this.x = x;
        this.y = y;
        this.radius = 20;
        
        // Status Base
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.speed = 180;        // pixels por segundo
        this.speedMultiplicador = 1.0; // Usado para debuffs (ex: poça de cola)
        this.damage = 35;        // dano por tiro
        this.fireRate = 0.6;     // tempo entre tiros em segundos
        this.bulletSpeed = 450;  // velocidade do projétil
        this.multiShot = 1;      // quantidade de tiros simultâneos
        this.currentBulletType = 'comum'; // Começa com tiro normal

        // Controle de disparo e arsenal
        this.shootTimer = 0;
        this.bullets = [];

        // Sistema de Progressão (XP)
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        
        // Callback para pausar e abrir menu (definido no gameLoop)
        this.onLevelUp = null; 
    }

    update(dt) {
        // 1. Movimento (Lido diretamente do joystick esquerdo no input.js)
        let velocidadeFinal = this.speed * this.speedMultiplicador;
        this.x += input.move.x * velocidadeFinal * dt;
        this.y += input.move.y * velocidadeFinal * dt;

        // 2. Cooldown de Tiro
        if (this.shootTimer > 0) {
            this.shootTimer -= dt;
        }

        // 3. Lógica de Atirar (Joystick direito ativo)
        if (input.isShooting && this.shootTimer <= 0) {
            this.shoot(input.aim.x, input.aim.y);
            this.shootTimer = this.fireRate; // Reseta o cooldown
        }

        // 4. Atualizar as próprias balas
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            
            // As balas precisam da posição do player para algumas lógicas (ex: invisível)
            b.update(dt, { x: this.x, y: this.y }); 
            
            // Balas "Lobbed" (lançadas) usam uma lógica de tempo interna no update
            // Balas normais limitamos aqui por segurança de memória
            if (b.dead || (b.lifeTime !== undefined && b.lifeTime > 10)) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot(dirX, dirY) {
        let baseAngle = Math.atan2(dirY, dirX);
        let spread = 15 * (Math.PI / 180); // 15 graus de espaçamento entre tiros
        let startAngle = baseAngle - (spread * (this.multiShot - 1)) / 2;

        const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
        const isLobbed = lobbedTypes.includes(this.currentBulletType);

        // Distância padrão para arremessar projéteis parabólicos
        const throwDistance = 350; 

        for (let i = 0; i < this.multiShot; i++) {
            let angle = startAngle + (i * spread);
            
            let vx = Math.cos(angle);
            let vy = Math.sin(angle);

            if (isLobbed) {
                // Tiro Parabólico (Morteiro)
                let targetX = this.x + (vx * throwDistance);
                let targetY = this.y + (vy * throwDistance);
                this.bullets.push(new LobbedProjectile(
                    this.x, this.y, 
                    targetX, targetY, 
                    this.currentBulletType, this.damage
                ));
            } else {
                // Tiro Direto Padrão
                this.bullets.push(new Bullet(
                    this.x, this.y, 
                    vx, vy, 
                    this.bulletSpeed, this.damage, 
                    'player', this.currentBulletType
                ));
            }
        }
    }

    gainXp(amount) {
        this.xp += amount;
        // Permite subir múltiplos níveis se ganhar muito XP de uma vez
        while (this.xp >= this.xpNeeded) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpNeeded;
        // Curva de dificuldade do XP (aumenta 25% a cada nível)
        this.xpNeeded = Math.floor(this.xpNeeded * 1.25);

        let choices = [];
        let shuffledBase = [...BASE_UPGRADES].sort(() => 0.5 - Math.random());

        // 25% de chance de aparecer uma Munição Especial nos upgrades!
        if (Math.random() <= 0.25) {
            let randomSpecial = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
            choices.push({
                id: 'bullet_' + randomSpecial,
                name: 'Munição: ' + randomSpecial.toUpperCase(),
                desc: 'Altera os teus disparos para ' + randomSpecial,
                apply: (p) => p.currentBulletType = randomSpecial
            });
            // Adiciona mais 3 opções normais para perfazer 4 escolhas
            choices.push(...shuffledBase.slice(0, 3));
        } else {
            // Se não cair munição especial, são 4 opções normais
            choices.push(...shuffledBase.slice(0, 4));
        }

        // Dispara o evento para o gameLoop pausar e mostrar a UI HTML
        if (this.onLevelUp) {
            this.onLevelUp(choices);
        }
    }

    applyUpgrade(upgradeId) {
        // Verifica se é uma mudança de munição
        if (upgradeId.startsWith('bullet_')) {
            this.currentBulletType = upgradeId.replace('bullet_', '');
            console.log(`Nova munição equipada: ${this.currentBulletType}`);
            return;
        }

        // Se for um status normal, procura no catálogo e aplica
        const upgrade = BASE_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            upgrade.apply(this);
            console.log(`Upgrade aplicado: ${upgrade.name}`);
        }
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        // 1. Renderiza os projéteis disparados pelo jogador
        for (let b of this.bullets) {
            b.draw(ctx, camera, {x: this.x, y: this.y});
        }

        // 2. Renderiza o Jogador (Círculo Ciano)
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Linha indicadora de mira (Laser/Ajuda visual)
        if (input.isShooting) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + input.aim.x * 60, drawY + input.aim.y * 60);
            ctx.stroke();
        }

        // 4. Interface Flutuante: Barra de Vida (HP)
        let hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillRect(drawX - 25, drawY + 30, 50, 6);
        ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
        ctx.fillRect(drawX - 25, drawY + 30, 50 * hpRatio, 6);

        // 5. Interface Flutuante: Barra de XP
        let xpRatio = Math.max(0, this.xp / this.xpNeeded);
        ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
        ctx.fillRect(drawX - 25, drawY + 40, 50, 4);
        ctx.fillStyle = "rgba(0, 150, 255, 0.9)";
        ctx.fillRect(drawX - 25, drawY + 40, 50 * xpRatio, 4);
        
        // 6. Nível atual (Texto pequeno acima da barra)
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Lvl ${this.level}`, drawX, drawY + 54);
    }
}


