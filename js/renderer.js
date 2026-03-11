import { ctx, canvas, GAME_WIDTH, GAME_HEIGHT, camera } from "./main.js";

export function updateCamera(player) {
    let targetX = player.x;
    let targetY = player.y;

    const activeDrone = player.bullets.find(b => b.type === 'drone' && !b.dead);

    if (activeDrone) {
        targetX = activeDrone.x;
        targetY = activeDrone.y;
    }

    const desiredX = targetX - (GAME_WIDTH / 2);
    const desiredY = targetY - (GAME_HEIGHT / 2);

    camera.x += (desiredX - camera.x) * 0.1;
    camera.y += (desiredY - camera.y) * 0.1;
}

export function renderGame(player, enemies, hazards) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    desenharGrelha();

    if (hazards) {
        for (let h of hazards) {
            h.draw(ctx, camera);
        }
    }

    player.draw(ctx, camera);

    if (enemies) {
        for (let e of enemies) {
            if (!e.dead) {
                // CORREÇÃO AQUI: Passamos o player para o inimigo desenhar as suas balas corretamente!
                e.draw(ctx, camera, player); 
            }
        }
    }
}

function desenharGrelha() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    const tamanhoCelula = 50;
    
    const offsetX = Math.floor(camera.x) % tamanhoCelula;
    const offsetY = Math.floor(camera.y) % tamanhoCelula;

    for (let x = -offsetX; x < GAME_WIDTH; x += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    }

    for (let y = -offsetY; y < GAME_HEIGHT; y += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }
}


