import { input } from "../../core/input.js";
import { gameData } from "../../config/configManager.js";
import { Bullet, LobbedProjectile } from "../projectiles/index.js";

export function handleShooting(player, dt, gameState) {
    const fireRate = player.stats.get('fireRate');
    const damage = player.stats.get('damage');
    const bulletSpeed = player.stats.get('bulletSpeed');
    const multishot = player.stats.get('multishot') || player.multiShot || 1;
    if (player.shootTimer > 0) {
        player.shootTimer -= dt;
    }
    if (input.isShooting && player.shootTimer <= 0) {
        executeShoot(player, gameState, damage, bulletSpeed, multishot);
        player.shootTimer = fireRate;
        if (player.onShootEffect) player.onShootEffect(player);
    }
}

function executeShoot(player, gameState, damage, bulletSpeed, multishot) {
    // 🔴 PARAQUEDAS: Se a config não existir, cria uma configuração "fantasma" básica
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
            projectile = new Bullet(
                player.x, player.y,
                vx, vy,
                bulletSpeed,
                damage,
                'player',
                player.currentBulletType
            );
        }
        projectile.source = 'player';
        gameState.projectiles.push(projectile);
    }
}

export function applyDamage(player, amount) {
    player.hp -= amount;
    if (player.hp < 0) {
        player.hp = 0;
    }
}
