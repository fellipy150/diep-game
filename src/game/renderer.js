import { ctx, canvas, GAME_WIDTH, GAME_HEIGHT } from "../main.js"; // Removida a 'camera' da importação

// Estado global da câmera com suporte a shake
export const camera = { x: 0, y: 0, shake: 0 };

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

    // Aplica e suaviza o Screen Shake
    if (camera.shake > 0) {
        camera.x += (Math.random() - 0.5) * camera.shake;
        camera.y += (Math.random() - 0.5) * camera.shake;
        camera.shake *= 0.9; // Dissipa o tremor gradualmente
        
        // Zera o shake se for muito pequeno para evitar cálculos desnecessários
        if (camera.shake < 0.1) camera.shake = 0; 
    }
}

// Adicionado o parâmetro damageNumbers com valor padrão vazio para retrocompatibilidade
export function renderGame(player, enemies, hazards, damageNumbers = []) {
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
                // Passamos o player para o inimigo desenhar as suas balas corretamente
                e.draw(ctx, camera, player); 
            }
        }
    }

    // Lógica para desenhar os Números de Dano Flutuantes
    for (let n of damageNumbers) {
        let drawX = n.x - camera.x;
        let drawY = n.y - camera.y;

        ctx.fillStyle = n.color;
        // O texto fica maior no início e diminui conforme a vida (life) acaba
        let fontSize = Math.max(12, 20 * n.life); 
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        
        // Aplica um efeito de fade-out (transparência) baseado na vida restante
        ctx.globalAlpha = Math.max(0, n.life);
        ctx.fillText(n.val, drawX, drawY);
        ctx.globalAlpha = 1.0; // Restaura a opacidade padrão
    }
}

function desenharGrelha() {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.08)"; // Cor neon ciano para as linhas
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

    // Adiciona pontos de luz nas interseções
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)"; // Ciano um pouco mais forte para os pontos
    for (let x = -offsetX; x < GAME_WIDTH; x += tamanhoCelula) {
        for (let y = -offsetY; y < GAME_HEIGHT; y += tamanhoCelula) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
