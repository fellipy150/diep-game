const SHAPES = {
    circle: (ctx, r) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    },
    triangle: (ctx, r) => {
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r);
        ctx.lineTo(-r, r);
        ctx.closePath();
        ctx.fill();
    },
    diamond: (ctx, r) => {
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();
    },
    hexagon: (ctx, r) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    },
};

export const RenderEnemy = (ctx, camera, enemy) => {
    // 1. Posição na tela
    const drawX = enemy.x - camera.x;
    const drawY = enemy.y - camera.y;

    // 2. Projéteis (camada inferior)
    for (let b of enemy.bullets) {
        b.draw(ctx, camera);
    }

    // 3. Desenho do Corpo Modular
    ctx.save();
    ctx.translate(drawX, drawY);
    
    // ACESSO ATUALIZADO: Busca no novo caminho de dados do Tipo
    const stats = enemy.type.stats;
    ctx.fillStyle = stats.color || "#ff00ff"; // Fallback para magenta se não houver cor
    
    const shapeKey = stats.shape || 'circle';
    const drawShape = SHAPES[shapeKey] || SHAPES.circle;
    
    drawShape(ctx, enemy.radius);
    ctx.restore();

    // 4. Indicador de Direção (Olho)
    if (enemy.shootTarget) {
        const angle = Math.atan2(
            enemy.shootTarget.y - enemy.y,
            enemy.shootTarget.x - enemy.x
        );
        
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(angle);
        ctx.fillStyle = "black";
        ctx.beginPath();
        // Desenha o olho na "frente" da forma
        ctx.arc(enemy.radius * 0.5, 0, enemy.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 5. Interface (Barra de Vida)
    if (enemy.hp < enemy.maxHp) {
        drawHealthBar(ctx, drawX, drawY, enemy.hp, enemy.maxHp);
    }
};

function drawHealthBar(ctx, x, y, hp, maxHp) {
    const width = 40;
    const height = 6;
    const barX = x - width / 2;
    const barY = y - 45; // Um pouco mais alto para não encavalar no "olho"

    // Fundo
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(barX, barY, width, height);

    // Vida (com transição de cor baseada no HP)
    const hpRatio = Math.max(0, hp / maxHp);
    ctx.fillStyle = hpRatio > 0.4 ? "#2ecc71" : (hpRatio > 0.2 ? "#f1c40f" : "#e74c3c");
    ctx.fillRect(barX, barY, width * hpRatio, height);
}
