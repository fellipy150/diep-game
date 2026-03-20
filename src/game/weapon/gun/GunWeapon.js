import { WeaponBase } from "../base/WeaponBase.js";
import { Bullet, LobbedProjectile } from "../../projectiles/index.js";
import { gameData } from "../../../config/configManager.js";

export class GunWeapon extends WeaponBase {
    constructor(config) {
        super(config.id || 'basic_gun', config.name || 'Pistola');
        this.maxSlots = config.maxSlots || 3;
        this.currentAmmo = this.maxSlots;
        this.reloadTime = config.reloadTime || 0.8;
        this.reloadTimer = 0;
        this.burstDelay = config.burstDelay || 0.1;
        this.burstTimer = 0;
        this.bulletColor = config.bulletColor || '#00ffff';
        this.bulletType = config.bulletType || 'normal';
    }
    update(dt, context) {
        if (this.currentAmmo < this.maxSlots) {
            this.reloadTimer += dt;
            if (this.reloadTimer >= this.reloadTime) {
                this.currentAmmo++;
                this.reloadTimer = 0;
            }
        }
        if (this.burstTimer > 0) {
            this.burstTimer -= dt;
        }
    }
    executeFire(context, aimDir) {
        if (this.currentAmmo <= 0 || this.burstTimer > 0) return false;
        const p = this.owner;
        if (!p) return false;
        const damage = p.stats ? p.stats.get('damage') : (p.type?.stats?.damage || 10);
        const bulletSpeed = p.stats ? p.stats.get('bulletSpeed') : (p.type?.stats?.bulletSpeed || 300);
        const multishot = p.stats ? (p.stats.get('multiShot') || 1) : 1;
        const isPlayer = !!p.stats;
        const config = (gameData.bullets && gameData.bullets[this.bulletType])
                       || { multishotScale: 1, type: 'normal' };
        // 3. Lógica de Multishot / Spread
        const baseAngle = Math.atan2(aimDir.y, aimDir.x);
        const shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(multishot * config.multishotScale));
        const spread = (15 * Math.PI / 180); // 15 graus em radianos
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
                    this.bulletType,
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
                    source: isPlayer ? 'player' : 'enemy',
                    color: this.bulletColor,
                    type: this.bulletType,
                    effects: p.activeBulletEffects || []
                });
            }
            context.addProjectile(projectile);
        }
        this.currentAmmo--;
        this.burstTimer = this.burstDelay;
        return true;
    }
}
