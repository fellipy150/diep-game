import { input } from "../../core/input.js";
import { gameData } from "../../config/configManager.js";
import { Bullet, LobbedProjectile } from "../projectiles/index.js";

/**
 * Gerencia o cooldown de tiro, o gatilho da arma e a atualização
 * dos projéteis que já estão na tela.
 */
export function handleShooting(player, dt) {
    const config = gameData.bullets[player.currentBulletType] || gameData.bullets['normal'];
    let effectiveFireRate = player.fireRate * (config.fireRateMult || 1);
    
    // Diminui o timer de cooldown
    if (player.shootTimer > 0) {
        player.shootTimer -= dt;
    }

    // Dispara caso o input esteja ativo e a arma pronta
    if (input.isShooting && player.shootTimer <= 0) {
        executeShoot(player, config);
        player.shootTimer = effectiveFireRate;
    }

    // Atualiza fisicamente as balas disparadas pelo jogador e remove as destruídas
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        player.bullets[i].update(dt);
        if (player.bullets[i].dead) {
            player.bullets.splice(i, 1);
        }
    }
}

/**
 * Lógica interna (privada ao módulo) para instanciar os projéteis,
 * calculando espalhamento (spread) e tiros múltiplos (multishot).
 */
function executeShoot(player, config) {
    let baseAngle = Math.atan2(input.aim.y, input.aim.x);
    let shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(player.multiShot * config.multishotScale));
    
    // 15 graus de spread
    let spread = (15 * Math.PI / 180); 
    let startAngle = baseAngle - (spread * (shotCount - 1)) / 2;

    for (let i = 0; i < shotCount; i++) {
        let ang = startAngle + (i * spread);
        let vx = Math.cos(ang);
        let vy = Math.sin(ang);
        
        if (config.type === 'lobbed') {
            player.bullets.push(new LobbedProjectile(
                player.x, player.y, 
                player.x + vx * 400, player.y + vy * 400, 
                player.currentBulletType, player.damage
            ));
        } else {
            player.bullets.push(new Bullet(
                player.x, player.y, 
                vx, vy, 
                player.bulletSpeed, player.damage, 
                'player', player.currentBulletType
            ));
        }
    }
}

/**
 * Reduz o HP do jogador.
 * Ideal para ser chamada quando um inimigo ou projétil colide com o player.
 */
export function applyDamage(player, amount) {
    player.hp -= amount;
    
    if (player.hp < 0) {
        player.hp = 0;
        // Futuramente: disparar evento de Game Over aqui
    }
}
