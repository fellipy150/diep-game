import { Bullet, LobbedProjectile } from "../../projectiles/index.js";
import { getSmartAim } from "../../../core/mathUtils.js";

export const Attack = (enemy) => {
    const target = enemy.shootTarget;
    if (!target || target.dead || enemy.shootCooldown > 0) return;

    // 1. Cálculo de mira (Smart Aim)
    const bulletSpeed = 300;
    const aim = getSmartAim(
        { x: enemy.x, y: enemy.y },
        { x: target.x, y: target.y },
        { x: target.velX || 0, y: target.velY || 0 },
        bulletSpeed,
        enemy.bulletType,
        target.radius || 20
    );

    if (!aim) return;

    // 2. Instanciação (Fábrica de Balas)
    const isLobbed = ['bomba', 'acido', 'cola'].includes(enemy.bulletType);
    
    if (isLobbed) {
        enemy.bullets.push(new LobbedProjectile(enemy.x, enemy.y, aim.targetX, aim.targetY, enemy.bulletType, 25));
    } else {
        const b = new Bullet(enemy.x, enemy.y, aim.x, aim.y, bulletSpeed, 25, 'enemy', enemy.bulletType, target);
        b.sender = enemy;
        enemy.bullets.push(b);
    }

    enemy.shootCooldown = enemy.fireRate;
};
