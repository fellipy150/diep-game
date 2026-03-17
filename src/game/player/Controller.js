import { input } from "../../core/input.js";

/**
 * Lê os inputs de movimento do jogador, normaliza vetores 
 * e calcula a velocidade baseada na aceleração e multiplicadores.
 */
export function handleInput(player, dt) {
    let dirX = input.move.x;
    let dirY = input.move.y;
    
    // Normaliza o vetor de movimento para evitar que o player ande mais rápido na diagonal
    const magSq = dirX * dirX + dirY * dirY;
    if (magSq > 1) {
        const mag = Math.sqrt(magSq);
        dirX /= mag;
        dirY /= mag;
    }

    // Calcula a aceleração considerando a base, a velocidade do player e os multiplicadores de efeitos (ex: cola)
    const acc = player.baseAcceleration * player.baseSpeed * player.currentSpeedMult;
    
    // Aplica a aceleração à velocidade atual
    player.velX += dirX * acc * dt;
    player.velY += dirY * acc * dt;
}

/**
 * Aplica a fricção e atualiza as coordenadas (x, y) do jogador.
 * Também gerencia atualizações puramente visuais ligadas ao movimento.
 */
export function updatePhysics(player, dt) {
    // Aplica fricção para desaceleração suave
    player.velX *= player.friction;
    player.velY *= player.friction;
    
    // Atualiza a posição final do jogador
    player.x += player.velX * dt;
    player.y += player.velY * dt;
    
    // Atualiza a rotação visual (cosmético)
    player.visualRotation += dt * 5;
}
