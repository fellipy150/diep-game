import { getType } from './types/typeLoader.js';
import { RenderEnemy } from './systems/RenderSystem.js';
import { createStandardGun } from "../weapon/gun/types/standart-gun.js";

export class Enemy {
    constructor(x, y, typeName = 'grunt', level = 1) {
        this.type = getType(typeName);
        this.x = x;
        this.y = y;
        this.level = level;
        const baseHp = this.type.stats.hp || 100;
        this.maxHp = baseHp * (1 + (level - 1) * 0.2);
        this.hp = this.maxHp;
        this.color = this.type.stats.color || '#ff0000';
        this.radius = this.type.stats.radius || 25;
        this.acceleration = this.type.stats.acceleration || 800;
        this.friction = 0.85;
        this.velX = 0;
        this.velY = 0;
        this.dead = false;
        this.bullets = [];
        this.dodgeCheckTimer = 0;
        this.meleeCooldown = 0;
        this.weapon = createStandardGun({
            bulletColor: '#ff4444',
            reloadTime: this.type.stats.reloadTime || 2.5,
            maxSlots: this.type.stats.maxAmmo || 3,
            burstDelay: this.type.stats.fireRate || 0.2
        });
        this.weapon.equip(this);
    }
    update(dt, player, allEnemies, hazards) {
        if (this.dead) return;
        if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
        if (this.dodgeCheckTimer > 0) this.dodgeCheckTimer -= dt;
        const context = {
            enemies: allEnemies,
            player,
            hazards,
            addProjectile: (p) => {
                if (!this.bullets) this.bullets = [];
                this.bullets.push(p);
            }
        };
        if (this.weapon) this.weapon.update(dt, context);
        const moveIntent = this.type.think(this, dt, player, allEnemies, hazards);
        if (moveIntent) {
            this.velX += moveIntent.x * this.acceleration * dt;
            this.velY += moveIntent.y * this.acceleration * dt;
        }
        this.velX *= this.friction;
        this.velY *= this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;
        this.updateBullets(dt, player);
    }
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }
    updateBullets(dt, player) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, player);
            if (b.dead) this.bullets.splice(i, 1);
        }
    }
    draw(ctx, camera) {
        RenderEnemy(ctx, camera, this);
    }
    getDistSq(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return dx * dx + dy * dy;
    }
}
