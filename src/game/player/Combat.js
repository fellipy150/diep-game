import { input } from "../../core/input.js";
import { gameData } from "../../config/configManager.js";
import { Bullet, LobbedProjectile } from "../projectiles/index.js";

/**
 * Gerencia o cooldown de tiro e dispara projéteis quando o input está ativo.
 * Agora utiliza os valores do StatSheet (damage, bulletSpeed, fireRate) e adiciona
 * os projéteis ao array global gameState.projectiles.
 * 
 * @param {Object} player - Instância do jogador.
 * @param {number} dt - Delta time em segundos.
 * @param {Object} gameState - Estado global do jogo (contém projectiles).
 */
export function handleShooting(player, dt, gameState) {
    // Obtém os valores atualizados do StatSheet
    const fireRate = player.stats.get('fireRate');
    const damage = player.stats.get('damage');
    const bulletSpeed = player.stats.get('bulletSpeed');
    const multishot = player.stats.get('multishot') || player.multiShot || 1; // fallback

    // Diminui o timer de cooldown
    if (player.shootTimer > 0) {
        player.shootTimer -= dt;
    }

    // Dispara caso o input esteja ativo e a arma pronta
    if (input.isShooting && player.shootTimer <= 0) {
        executeShoot(player, gameState, damage, bulletSpeed, multishot);
        player.shootTimer = fireRate;

        // 🔥 Se houver uma sinergia ativa (ex: Berserker)
        if (player.onShootEffect) player.onShootEffect(player);
    }

    // A atualização dos projéteis agora é feita em outro local (ex: physics.js ou loop principal)
    // Removido o loop interno para manter a separação de responsabilidades.
}

/**
 * Lógica interna para instanciar os projéteis, calculando espalhamento (spread)
 * e tiros múltiplos (multishot). Usa os parâmetros atualizados do StatSheet.
 */
function executeShoot(player, gameState, damage, bulletSpeed, multishot) {
    const config = gameData.bullets[player.currentBulletType] || gameData.bullets['normal'];
    let baseAngle = Math.atan2(input.aim.y, input.aim.x);
    let shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(multishot * config.multishotScale));
    
    // 15 graus de spread
    let spread = (15 * Math.PI / 180); 
    let startAngle = baseAngle - (spread * (shotCount - 1)) / 2;

    for (let i = 0; i < shotCount; i++) {
        let ang = startAngle + (i * spread);
        let vx = Math.cos(ang);
        let vy = Math.sin(ang);
        
        let projectile;
        if (config.type === 'lobbed') {
            projectile = new LobbedProjectile(
                player.x, player.y,
                player.x + vx * 400, player.y + vy * 400,
                player.currentBulletType,
                damage // usa o damage do StatSheet
            );
        } else {
            projectile = new Bullet(
                player.x, player.y,
                vx, vy,
                bulletSpeed, // usa bulletSpeed do StatSheet
                damage,
                'player',
                player.currentBulletType
            );
        }
        // Define a origem para identificação em colisões (opcional)
        projectile.source = 'player';
        gameState.projectiles.push(projectile);
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
