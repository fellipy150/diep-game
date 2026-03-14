export const camera = { x: 0, y: 0, shake: 0 };
export function updateCamera(player, gameWidth, gameHeight) {
    let targetX = player.x;
    let targetY = player.y;
    const activeDrone = player.bullets.find(b => b.type === 'drone' && !b.dead);
    if (activeDrone) {
        targetX = activeDrone.x;
        targetY = activeDrone.y;
    }
    const desiredX = targetX - (gameWidth / 2);
    const desiredY = targetY - (gameHeight / 2);
    camera.x += (desiredX - camera.x) * 0.1;
    camera.y += (desiredY - camera.y) * 0.1;
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= 0.9;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}
export function renderGame(ctx, canvas, player, enemies, hazards, damageNumbers = []) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    desenharGrelha(ctx, canvas.width, canvas.height);
    if (hazards) {
        for (let h of hazards) {
            h.draw(ctx, camera);
        }
    }
    player.draw(ctx, camera);
    if (enemies) {
        for (let e of enemies) {
            if (!e.dead) {
                e.draw(ctx, camera, player);
            }
        }
    }
    for (let n of damageNumbers) {
        let drawX = n.x - camera.x;
        let drawY = n.y - camera.y;
        ctx.fillStyle = n.color;
        let fontSize = Math.max(12, 20 * n.life);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.globalAlpha = Math.max(0, n.life);
        ctx.fillText(n.val, drawX, drawY);
        ctx.globalAlpha = 1.0;
    }
}
function desenharGrelha(ctx, gameWidth, gameHeight) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    const tamanhoCelula = 50;
    const offsetX = Math.floor(camera.x) % tamanhoCelula;
    const offsetY = Math.floor(camera.y) % tamanhoCelula;
    for (let x = -offsetX; x < gameWidth; x += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameHeight);
        ctx.stroke();
    }
    for (let y = -offsetY; y < gameHeight; y += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gameWidth, y);
        ctx.stroke();
    }
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    for (let x = -offsetX; x < gameWidth; x += tamanhoCelula) {
        for (let y = -offsetY; y < gameHeight; y += tamanhoCelula) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
