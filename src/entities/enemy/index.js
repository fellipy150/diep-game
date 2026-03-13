import { getType } from './types/typeLoader.js';
import { RenderEnemy } from './systems/RenderSystem.js';

export class Enemy {
    constructor(x, y, typeName = 'grunt') {
        // 1. Carrega o "DNA" do inimigo dinamicamente
        this.type = getType(typeName);
        
        // 2. Inicializa os dados baseados na configuração do Tipo
        this.x = x;
        this.y = y;
        this.hp = this.type.stats.hp;
        this.maxHp = this.hp;
        this.color = this.type.stats.color;
        this.fireRate = this.type.stats.fireRate;
        this.radius = this.type.stats.radius || 25;
        
        // Físicas Base (Podem ser movidas para o stats do tipo também se desejar)
        this.velX = 0;
        this.velY = 0;
        this.acceleration = this.type.stats.acceleration || 800;
        this.friction = 0.85;
        
        // Estados
        this.dead = false;
        this.bullets = [];
        this.shootCooldown = 0;
        this.shootTarget = null;
        this.dodgeCheckTimer = 0;
    }

    update(dt, player, allEnemies, threatBullets) {
        if (this.dead) return;

        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.dodgeCheckTimer > 0) this.dodgeCheckTimer -= dt;

        // --- EXECUÇÃO DO MAESTRO ---
        // O Cérebro (think) retorna a intenção de movimento {x, y}
        const moveIntent = this.type.think(this, dt, player, allEnemies, threatBullets);

        // --- APLICAÇÃO DA FÍSICA ---
        this.velX += moveIntent.x * this.acceleration * dt;
        this.velY += moveIntent.y * this.acceleration * dt;
        this.velX *= this.friction;
        this.velY *= this.friction;
        
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // --- LIMPEZA ---
        this.updateBullets(dt, player);
    }

    updateBullets(dt, player) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, player);
            if (b.dead) this.bullets.splice(i, 1);
        }
    }

    draw(ctx, camera) {
        // Passamos o 'this' completo, e o RenderSystem lê 'this.type.stats.shape'
        RenderEnemy(ctx, camera, this);
    }

    // Helper matemático que todos os cérebros vão usar
    getDistSq(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return dx * dx + dy * dy;
    }
}
