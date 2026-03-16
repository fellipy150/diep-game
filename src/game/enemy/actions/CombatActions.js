import { Bullet } from "../../projectiles/index.js";
export const CombatActions = {
    simpleShoot: (enemy) => {
        if (!enemy.shootTarget || enemy.shootCooldown > 0) return;
        const dx = enemy.shootTarget.x - enemy.x;
        const dy = enemy.shootTarget.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        const b = new Bullet(
            enemy.x,
            enemy.y,
            Math.cos(angle),
            Math.sin(angle),
            enemy.bulletSpeed || 300,
            enemy.damage || 10,
            'enemy'
        );
        b.sender = enemy;
        enemy.bullets.push(b);
        enemy.shootCooldown = enemy.fireRate || 2.0;
    }
};
