import { player, enemies, gerenciarSpawns } from "./main.js";
import { updateCamera, renderGame } from "./renderer.js";
import { hazards } from "./bullet.js";

let lastTime = 0;
export let isPaused = false; 
export let isGameOver = false;

export function startGameLoop() {
    player.onLevelUp = (choices) => {
        isPaused = true;
        mostrarMenuLevelUp(choices);
    };

    requestAnimationFrame(loop);
}

function loop(time) {
    let dt = (time - lastTime) / 1000;
    lastTime = time;

    if (dt > 0.1) dt = 0.1;

    if (!isPaused && !isGameOver) {
        update(dt);
    }
    
    updateCamera(player);
    renderGame(player, enemies, hazards);

    if (isGameOver) {
        desenharGameOver();
    }

    requestAnimationFrame(loop);
}

function update(dt) {
    player.update(dt);
    gerenciarSpawns(dt);

    let allBullets = [...player.bullets];
    for (let e of enemies) {
        allBullets.push(...e.bullets);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (e.dead) {
            enemies.splice(i, 1);
            player.gainXp(40);
        } else {
            e.update(dt, player, enemies, allBullets);
        }
    }

    for (let i = hazards.length - 1; i >= 0; i--) {
        hazards[i].update(dt);
        if (hazards[i].dead) {
            hazards.splice(i, 1);
        }
    }

    processarColisoes();

    if (player.hp <= 0) {
        isGameOver = true;
    }
}

// ==========================================
// SISTEMA DE COLISÕES (FÍSICA 2D)
// ==========================================

function verificarColisao(obj1, obj2) {
    let dx = obj1.x - obj2.x;
    let dy = obj1.y - obj2.y;
    let dist = Math.hypot(dx, dy);
    return dist < (obj1.radius + obj2.radius);
}

function processarColisoes() {
    // A. COLISÃO FÍSICA (Empurrão) E DANO MELEE
    for (let e of enemies) {
        if (e.dead) continue;
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);
        let minDist = player.radius + e.radius;

        if (dist < minDist) {
            let overlap = minDist - dist;
            let nx = dx / dist || 1;
            let ny = dy / dist || 0;
            
            player.x += nx * (overlap / 2);
            player.y += ny * (overlap / 2);
            e.x -= nx * (overlap / 2);
            e.y -= ny * (overlap / 2);

            if (e.aiType === 'melee' && e.meleeCooldown <= 0) {
                player.hp -= 20; 
                e.meleeCooldown = 1.0; 
                aplicarEfeitoDeSolo(player, 'impact');
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            let e1 = enemies[i];
            let e2 = enemies[j];
            if (e1.dead || e2.dead) continue;

            let dx = e1.x - e2.x;
            let dy = e1.y - e2.y;
            let dist = Math.hypot(dx, dy);
            let minDist = e1.radius + e2.radius;

            if (dist < minDist) {
                let overlap = minDist - dist;
                let nx = dx / dist || 1;
                let ny = dy / dist || 0;
                e1.x += nx * (overlap / 2);
                e1.y += ny * (overlap / 2);
                e2.x -= nx * (overlap / 2);
                e2.y -= ny * (overlap / 2);
            }
        }
    }

    // Projéteis e Áreas
    for (let b of player.bullets) {
        if (b.dead) continue;
        for (let e of enemies) {
            if (!e.dead && verificarColisao(b, e)) {
                e.takeDamage(b.damage);
                b.onHit(e);
                if (b.dead) break;
            }
        }
    }

    for (let atirador of enemies) {
        for (let b of atirador.bullets) {
            if (b.dead || !b.radius) continue;
            if (verificarColisao(b, player)) {
                player.hp -= b.damage;
                b.onHit(player);
                continue;
            }
            for (let vitima of enemies) {
                if (atirador !== vitima && !vitima.dead && verificarColisao(b, vitima)) {
                    vitima.takeDamage(b.damage);
                    b.onHit(vitima);
                    break;
                }
            }
        }
    }

    for (let h of hazards) {
        if (!h.dead && h.canDamage()) {
            if (verificarColisao({x: h.x, y: h.y, radius: h.radius}, player)) {
                player.hp -= h.damage;
                aplicarEfeitoDeSolo(player, h.type);
            }
            for (let e of enemies) {
                if (!e.dead && verificarColisao({x: h.x, y: h.y, radius: h.radius}, e)) {
                    e.takeDamage(h.damage);
                    aplicarEfeitoDeSolo(e, h.type);
                }
            }
        }
    }

    // Cleanup
    player.bullets = player.bullets.filter(b => !b.dead);
    for (let e of enemies) {
        e.bullets = e.bullets.filter(b => !b.dead);
    }
}

function aplicarEfeitoDeSolo(entidade, tipoDeHazard) {
    if (tipoDeHazard === 'cola') {
        entidade.speedMultiplicador = 0.3;
        setTimeout(() => {
            entidade.speedMultiplicador = 1.0;
        }, 2000);
    }
}

// ==========================================
// INTERFACE SYSTEM (MENUS)
// ==========================================

function desenharGameOver() {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "red";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`You reached Level ${player.level}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText("Reload the page to try again", canvas.width / 2, canvas.height / 2 + 70);
}

function mostrarMenuLevelUp(choices) {
    const overlay = document.createElement('div');
    overlay.id = 'levelup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100vw'; overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '100';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'sans-serif';

    // Proteção para ignorar toques no fundo do overlay
    overlay.addEventListener('pointerdown', (e) => {
        if (e.target === overlay) {
            e.stopPropagation();
            e.preventDefault();
        }
    });

    const titulo = document.createElement('h1');
    titulo.innerText = `Level ${player.level}! Choose an Upgrade:`;
    titulo.style.marginBottom = '20px';
    overlay.appendChild(titulo);

    choices.forEach(upgrade => {
        const btn = document.createElement('button');
        btn.style.margin = '8px';
        btn.style.padding = '12px';
        btn.style.backgroundColor = '#111';
        btn.style.color = '#0ff';
        btn.style.border = '1px solid #0ff';
        btn.style.borderRadius = '4px';
        btn.style.width = '300px';
        btn.style.cursor = 'pointer';
        
        btn.innerHTML = `<strong>${upgrade.name}</strong><br><small style="color:#aaa">${upgrade.desc}</small>`;
        
        // Resposta imediata e proteção de propagação
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            selecionarUpgrade(upgrade.id, overlay);
        });

        overlay.appendChild(btn);
    });

    document.body.appendChild(overlay);
}

function selecionarUpgrade(upgradeId, overlay) {
    player.applyUpgrade(upgradeId);
    if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
    }
    isPaused = false;
}
