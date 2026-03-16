// Importando os módulos especialistas
import { handleInput, updatePhysics } from "./Controller.js";
import { handleShooting, applyDamage } from "./Combat.js";
import { addStatusEffect, updateStatusEffects } from "./status.js";
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";

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
        this.currentSpeedMult = 1.0;
        this.activeEffects = [];
        this.efeitoColaTimer = 0;

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
        updateStatusEffects(this, dt);
        handleInput(this, dt);
        updatePhysics(this, dt);
        handleShooting(this, dt);
    }

    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }

    // --- Wrappers (Facilitadores para acesso externo) ---

    takeDamage(amount) {
        applyDamage(this, amount);
    }

    addEffect(type, duration) {
        addStatusEffect(this, type, duration);
    }

    addXp(amount) {
        gainXp(this, amount);
    }

    giveUpgrade(upgradeId) {
        return applyUpgrade(this, upgradeId);
    }
}
