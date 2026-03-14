// src/entities/enemy/actions/CombatActions.js
import { Bullet } from "../../projectiles/index.js";

/**
 * Verbos de combate para os inimigos
 */
export const CombatActions = {
    /**
     * Tiro simples: mira na posição atual do alvo e dispara.
     */
    simpleShoot: (enemy) => {
        // Se não tiver alvo ou ainda estiver em recarga, cancela
        if (!enemy.shootTarget || enemy.shootCooldown > 0) return;

        const dx = enemy.shootTarget.x - enemy.x;
        const dy = enemy.shootTarget.y - enemy.y;
        const angle = Math.atan2(dy, dx);

        // Cria a bala (verifique se sua classe Bullet aceita esses parâmetros)
        const b = new Bullet(
            enemy.x, 
            enemy.y,
            Math.cos(angle), 
            Math.sin(angle),
            enemy.bulletSpeed || 300,
            enemy.damage || 10,
            'enemy' // Tag para o sistema de colisão saber que veio do inimigo
        );
        
        // Referência para evitar fogo amigo se necessário
        b.sender = enemy; 
        
        // Adiciona à lista de balas do próprio inimigo (o renderSystem lê aqui)
        enemy.bullets.push(b);

        // Reseta o timer de cadência baseado nos stats do DNA do inimigo
        enemy.shootCooldown = enemy.fireRate || 2.0;
    }
};
