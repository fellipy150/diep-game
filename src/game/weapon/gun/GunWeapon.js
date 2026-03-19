import { WeaponBase } from "../base/WeaponBase.js";
import { Bullet, LobbedProjectile } from "../../projectiles/index.js";
import { input } from "../../../core/input.js";
import { gameData } from "../../../config/configManager.js";

export class GunWeapon extends WeaponBase {
    constructor() {
        super('basic_gun', 'Pistola Padrão');
        this.shootTimer = 0;
    }

    update(dt, context) {
        const p = this.owner;
        if (!p) return;

        // Puxa stats reativos da StatSheet do Player
        const fireRate = p.stats.get('fireRate');
        const damage = p.stats.get('damage');
        const bulletSpeed = p.stats.get('bulletSpeed');
        const multishot = p.stats.get('multiShot') || 1;

        if (this.shootTimer > 0) this.shootTimer -= dt;

        if (input.isShooting && this.shootTimer <= 0) {
            this.executeShoot(context, damage, bulletSpeed, multishot);
            this.shootTimer = fireRate;
            
            // Hook para sinergias (como o Modo Berserker)
            if (p.onShootEffect) p.onShootEffect(p);
        }
    }

    executeShoot(context, damage, bulletSpeed, multishot) {
        const p = this.owner;
        const config = (gameData.bullets && gameData.bullets[p.currentBulletType]) 
                       || { multishotScale: 1, type: 'normal' };

        const baseAngle = Math.atan2(input.aim.y, input.aim.x);
        const shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(multishot * config.multishotScale));
        const spread = (15 * Math.PI / 180);
        const startAngle = baseAngle - (spread * (shotCount - 1)) / 2;

        for (let i = 0; i < shotCount; i++) {
            const ang = startAngle + (i * spread);
            const vx = Math.cos(ang);
            const vy = Math.sin(ang);

            let projectile;
            if (config.type === 'lobbed') {
                projectile = new LobbedProjectile(p.x, p.y, p.x + vx * 400, p.y + vy * 400, p.currentBulletType, damage);
            } else {
                projectile = new Bullet(p.x, p.y, vx, vy, bulletSpeed, damage, 'player', p.currentBulletType);
            }

            context.addProjectile(projectile);
        }
    }
}
