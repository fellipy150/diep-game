// 1. Importação dos módulos especialistas e funções de status
import { handleShooting, applyDamage } from "./Combat.js";
import { updateStatusEffects } from './status.js'; 
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input.js"; // Assumindo a localização do input

export class Player {
    constructor(x, y) {
        // --- Física e Movimento ---
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.radius = 20;
        this.baseAcceleration = 1400;
        this.friction = 0.88;
        this.visualRotation = 0;

        // --- Status Base ---
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.baseSpeed = 1.0;
        
        // NOTA: 'this.currentSpeedMult' e 'this.efeitoColaTimer' removidos.
        // O StatSheet e o módulo de status agora injetam/gerenciam 'this.speed'.
        this.activeEffects = []; 

        // --- Combate ---
        this.damage = 40;
        this.fireRate = 0.6;
        this.bulletSpeed = 500;
        this.multiShot = 1;
        this.currentBulletType = 'normal';
        this.shootTimer = 0;
        this.bullets = [];
        
        // --- RPG e Progressão ---
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = [];
    }

    // --- Ciclo de Vida Principal ---

    update(dt) {
        // 2. Gestão de efeitos e modificadores temporários
        // O StatSheet recalcula 'this.speed' aqui dentro se os efeitos mudarem
        updateStatusEffects(this, dt);

        // 3. Movimentação Simplificada
        // 'input' é o singleton que monitora teclado/mouse
        let dirX = input.move.x;
        let dirY = input.move.y;
        
        // Normalização do vetor de movimento (evita que andar na diagonal seja mais rápido)
        let mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) { 
            dirX /= mag; 
            dirY /= mag; 
        }

        // A MÁGICA: 'this.speed' já vem com o redutor da cola ou bônus de upgrade
        let acc = this.baseAcceleration * this.speed; 
        
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 4. Delegação de Combate
        handleShooting(this, dt);
    }

    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }

    // --- Wrappers (Facilitadores para acesso externo) ---

    takeDamage(amount) {
        applyDamage(this, amount);
    }

    addXp(amount) {
        gainXp(this, amount);
    }

    giveUpgrade(upgradeId) {
        return applyUpgrade(this, upgradeId);
    }
}
