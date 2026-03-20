import { WeaponBase } from "../base/WeaponBase.js";
import { Bullet, LobbedProjectile } from "../../projectiles/index.js";
import { input } from "../../../core/input.js";
import { gameData } from "../../../config/configManager.js";
export class GunWeapon extends WeaponBase {
    constructor() {
        super('basic_gun', 'Pistola de Slots');
        this.maxSlots = 3;
        this.currentAmmo = 3;
        this.reloadTimer = 0;
        this.reloadTime = 1.5;
        this.burstDelay = 0.1;
        this.burstTimer = 0;
    }
    update(dt, context) {
        const p = this.owner;
        if (!p) return;
        if (this.currentAmmo < this.maxSlots) {
            this.reloadTimer += dt;
            if (this.reloadTimer >= this.reloadTime) {
                this.currentAmmo++;
                this.reloadTimer = 0;
            }
        }
        if (this.burstTimer > 0) this.burstTimer -= dt;
        // 2. Disparo ao SOLTAR (Fire on Release / Tap)
        if (input.fireReleased) {
            if (this.currentAmmo > 0 && this.burstTimer <= 0) {
                this.fire(context);
                this.currentAmmo--;
                this.burstTimer = this.burstDelay;
                if (p.onShootEffect) p.onShootEffect(p);
            }
            input.fireReleased = false;
        }
    }
    findNearestEnemy(context) {
        let nearest = null;
        let minDistSq = Infinity;
        if (!context.enemies) return null;
        for (const enemy of context.enemies) {
            if (enemy.dead) continue;
            const dx = enemy.x - this.owner.x;
            const dy = enemy.y - this.owner.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = enemy;
            }
        }
        return nearest;
    }
    fire(context) {
        const p = this.owner;
        let shootDir = { x: input.lastAim.x, y: input.lastAim.y };
        if (input.isTap) {
            const target = this.findNearestEnemy(context);
            if (target) {
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.hypot(dx, dy);
                shootDir = { x: dx / dist, y: dy / dist };
                p.lockedTarget = target;
                p.lockOnTimer = 1.0;
                input.lastAim = { ...shootDir };
            }
        }
        const damage = p.stats.get('damage');
        const bulletSpeed = p.stats.get('bulletSpeed');
        const multishot = p.stats.get('multiShot') || 1;
        const config = (gameData.bullets && gameData.bullets[p.currentBulletType])
                       || { multishotScale: 1, type: 'normal' };
        // --- Lógica de Espalhamento / Multishot ---
        const baseAngle = Math.atan2(shootDir.y, shootDir.x);
        const shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(multishot * config.multishotScale));
        const spread = (15 * Math.PI / 180);
        const startAngle = baseAngle - (spread * (shotCount - 1)) / 2;
        for (let i = 0; i < shotCount; i++) {
            const ang = startAngle + (i * spread);
            const vx = Math.cos(ang);
            const vy = Math.sin(ang);
            let projectile;
            if (config.type === 'lobbed') {
                projectile = new LobbedProjectile(
                    p.x, p.y,
                    p.x + vx * 400, p.y + vy * 400,
                    p.currentBulletType,
                    damage
                );
            } else {
                projectile = new Bullet({
                    x: p.x,
                    y: p.y,
                    vx: vx,
                    vy: vy,
                    speed: bulletSpeed,
                    damage: damage,
                    source: 'player',
                    color: '#00ffff',
                    type: p.currentBulletType,
                    effects: p.activeBulletEffects || []
                });
            }
            context.addProjectile(projectile);
        }
    }
}
