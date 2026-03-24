import { ProjectilePool } from "../projectiles/ProjectilePool.js";
import { LobbedProjectile } from "../projectiles/index.js";
import { input } from "../../core/input/index.js";
import { gameData } from "../../config/configManager.js";

function executeShoot(player, gameState, damage, bulletSpeed, multishot) {
    const config = (gameData.bullets && gameData.bullets[player.currentBulletType])
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
            projectile = new LobbedProjectile(
                player.x, player.y,
                player.x + vx * 400, player.y + vy * 400,
                player.currentBulletType,
                damage
            );
        } else {
            projectile = ProjectilePool.get(
                player.x, player.y,
                vx, vy,
                bulletSpeed,
                damage,
                'player',
                player.currentBulletType
            );
        }
        projectile.source = 'player';
        player.bullets.push(projectile);
    }
}
export function applyDamage(player, amount) {
    player.hp -= amount;
    if (player.hp < 0) {
        player.hp = 0;
    }
}
