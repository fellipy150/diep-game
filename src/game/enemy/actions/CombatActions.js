import { Bullet } from "../../projectiles/index.js";
export const CombatActions = {
    simpleShoot: (enemy) => {
        if (!enemy.shootTarget || enemy.shootCooldown > 0 || enemy.ammo <= 0) return;
        const dx = enemy.shootTarget.x - enemy.x;
        const dy = enemy.shootTarget.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        const b = new Bullet({
            x: enemy.x,
            y: enemy.y,
            vx: dx / dist,
            vy: dy / dist,
            speed: enemy.type.stats.bulletSpeed || 250,
            damage: enemy.type.stats.damage || 10,
            source: 'enemy',
            color: '#ff4444'
        });
        if (!enemy.bullets) enemy.bullets = [];
        enemy.bullets.push(b);
        enemy.ammo--;
        enemy.shootCooldown = enemy.type.stats.fireRate || 0.2;
    }
};
