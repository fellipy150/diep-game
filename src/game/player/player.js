import { handleShooting, applyDamage } from "./Combat.js";
import { updateStatusEffects, StatSheet } from './status.js';
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input.js";
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.radius = 20;
        this.baseAcceleration = 1400;
        this.friction = 0.88;
        this.visualRotation = 0;
        this.stats = new StatSheet({
            maxHp: 200,
            speed: 1.0,
            damage: 40,
            fireRate: 0.6,
            bulletSpeed: 500,
            multiShot: 1
        });
        this.hp = this.stats.get('maxHp');
        this.activeEffects = [];
        this.currentBulletType = 'normal';
        this.shootTimer = 0;
        this.bullets = [];
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = new Set();
    }
    get damage() { return this.stats.get('damage'); }
    get fireRate() { return this.stats.get('fireRate'); }
    get speed() { return this.stats.get('speed'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get bulletSpeed() { return this.stats.get('bulletSpeed'); }
    get multiShot() { return this.stats.get('multiShot'); }
    update(dt) {
        // 1. Atualiza timers de buffs/debuffs
        updateStatusEffects(this, dt);
        let dirX = input.move.x;
        let dirY = input.move.y;
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) {
            dirX /= mag;
            dirY /= mag;
        }
        // Agora 'this.speed' aciona o getter e é reativo aos upgrades/efeitos!
        const acc = this.baseAcceleration * this.speed;
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;
        handleShooting(this, dt);
    }
    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }
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
