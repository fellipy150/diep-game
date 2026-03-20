import { handleShooting, applyDamage } from "./Combat.js";
import { updateStatusEffects, StatSheet } from './status.js';
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input/index.js";
import { createStandardGun } from "../weapon/gun/types/standart-gun.js";
import { GameContext } from "../weapon/base/GameContext.js";

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
        this.bullets = [];
        this.lockedTarget = null;
        this.lockOnTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = new Set();
        this.weapon = createStandardGun();
        this.weapon.equip(this);
    }
    get damage() { return this.stats.get('damage'); }
    get fireRate() { return this.stats.get('fireRate'); }
    get speed() { return this.stats.get('speed'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get bulletSpeed() { return this.stats.get('bulletSpeed'); }
    get multiShot() { return this.stats.get('multiShot'); }
    findNearestTarget(context) {
        let nearest = null;
        let minDistSq = Infinity;
        const validTargets = [...(context.enemies || [])];
        if (context.hazards) {
            validTargets.push(...context.hazards.filter(h => h.isTargetable));
        }
        for (const target of validTargets) {
            if (target.dead) continue;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = target;
            }
        }
        return nearest;
    }
    update(dt, gameState) {
        updateStatusEffects(this, dt);
        let dirX = input.move.x;
        let dirY = input.move.y;
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) {
            dirX /= mag;
            dirY /= mag;
        }
        const acc = this.baseAcceleration * this.speed;
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;
        for (const b of this.bullets) {
            if (!b.dead) b.update(dt);
        }
        if (this.lockOnTimer > 0) {
            this.lockOnTimer -= dt;
            if (this.lockOnTimer <= 0) this.lockedTarget = null;
        }
        const context = new GameContext(gameState);
        this.weapon.update(dt, context);
        if (input.fireReleased) {
            let aimDir = { x: input.lastAim.x, y: input.lastAim.y };
            if (input.isTap) {
                const target = this.findNearestTarget(context);
                if (target) {
                    const dx = target.x - this.x;
                    const dy = target.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    aimDir = { x: dx / dist, y: dy / dist };
                    this.lockedTarget = target;
                    this.lockOnTimer = 1.0;
                    input.lastAim = { ...aimDir };
                }
            }
            const fired = this.weapon.executeFire(context, aimDir);
            if (fired && this.onShootEffect) {
                this.onShootEffect(this);
            }
            input.fireReleased = false;
        }
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
