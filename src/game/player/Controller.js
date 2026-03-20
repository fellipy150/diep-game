import { input } from "../../core/input/index.js";

export function handleInput(player, dt) {
    let dirX = input.move.x;
    let dirY = input.move.y;
    const magSq = dirX * dirX + dirY * dirY;
    if (magSq > 1) {
        const mag = Math.sqrt(magSq);
        dirX /= mag;
        dirY /= mag;
    }
    const acc = player.baseAcceleration * player.baseSpeed * player.currentSpeedMult;
    player.velX += dirX * acc * dt;
    player.velY += dirY * acc * dt;
}
export function updatePhysics(player, dt) {
    player.velX *= player.friction;
    player.velY *= player.friction;
    player.x += player.velX * dt;
    player.y += player.velY * dt;
    player.visualRotation += dt * 5;
}
