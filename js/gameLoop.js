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
    
    // Passamos a array de enemies para o renderer
    renderGame(player, enemies, hazards);

    if (isGameOver) {
        desenharGameOver();
    }

    requestAnimationFrame(loop);
}

function update(dt) {
    // 1. Atualiza o Jogador
    player.update(dt);

    // 2. Gere o nascimento de novos inimigos
    gerenciarSpawns(dt);

    // 3. Recolhe TODAS as balas do jogo para a I.A. se desviar
    let allBullets = [...player.bullets];
    for (let e of enemies) {
        allBullets.push(...e.bullets);
    }

    // 4. Atualiza os Inimigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (e.dead) {
            enemies.splice(i, 1); // Remove os mortos da lista
            player.gainXp(40); // Dá XP ao jogador!
        } else {
            e.update(dt, player, enemies, allBullets);
        }
    }

    // 5. Atualiza as Poças e Perigos no Chão
    for (let i = hazards.length - 1; i >= 0; i--) {
        hazards[i].update(dt);
        if (hazards[i].dead) {
            hazards.splice(i, 1);
        }
    }

    // 6. Processa todas as Colisões (Tiros e Fogo Amigo)
    processarColisoes();

    // 7. Verifica Game Over
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
    // A. Balas do Jogador -> Inimigos
    for (let b of player.bullets) {
        if (b.dead) continue;
        for (let e of enemies) {
            if (!e.dead && verificarColisao(b, e)) {
                e.takeDamage(b.damage); // Usa o takeDamage para resetar o tempo de cura deles!
                b.onHit(e);
                if (b.dead) break; // Se a bala não for penetrante, para de verificar outros inimigos
            }
        }
    }

    // B. Balas dos Inimigos -> Jogador E Outros Inimigos (Fogo Amigo / PvEvE)
    for (let atirador of enemies) {
        for (let b of atirador.bullets) {
            if (b.dead || !b.radius) continue; // Ignora balas mortas ou mísseis no ar (sem raio de colisão)

            // Colisão com o Jogador
            if (verificarColisao(b, player)) {
                player.hp -= b.damage;
                b.onHit(player);
                continue;
            }

            // Colisão com outros Inimigos (Se atirarem uns nos outros)
            for (let vitima of enemies) {
                if (atirador !== vitima && !vitima.dead && verificarColisao(b, vitima)) {
                    vitima.takeDamage(b.damage);
                    b.onHit(vitima);
                    break;
                }
            }
        }
    }

    // C. Hazards (Poças de Ácido, Fogo, Cola) -> Jogador e Inimigos
    for (let h of hazards) {
        if (!h.dead && h.canDamage()) {
            // Afeta o Jogador
            if (verificarColisao({x: h.x, y: h.y, radius: h.radius}, player)) {
                player.hp -= h.damage;
                aplicarEfeitoDeSolo(player, h.type);
            }
            
            // Afeta Inimigos
            for (let e of enemies) {
                if (!e.dead && verificarColisao({x: h.x, y: h.y, radius: h.radius}, e)) {
                    e.takeDamage(h.damage);
                    aplicarEfeitoDeSolo(e, h.type);
                }
            }
        }
    }

    // D. Limpeza Visual (Remove balas que já colidiram)
    player.bullets = player.bullets.filter(b => !b.dead);
    for (let e of enemies) {
        e.bullets = e.bullets.filter(b => !b.dead);
    }
}

function aplicarEfeitoDeSolo(entidade, tipoDeHazard) {
    if (tipoDeHazard === 'cola') {
        entidade.speedMultiplicador = 0.3; // Aplica debuff
        setTimeout(() => {
            entidade.speedMultiplicador = 1.0;
        }, 2000);
    }
}

// ==========================================
// SISTEMA DE INTERFACE (MENUS)
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
    ctx.fillText(`Chegaste ao Nível ${player.level}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText("Recarrega a página para tentar de novo", canvas.width / 2, canvas.height / 2 + 70);
}

function mostrarMenuLevelUp(choices) {
    const overlay = document.createElement('div');
    overlay.id = 'levelup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '100';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'sans-serif';

    const titulo = document.createElement('h1');
    titulo.innerText = `Nível ${player.level}! Escolhe um Upgrade:`;
    titulo.style.textAlign = 'center';
    titulo.style.marginBottom = '20px';
    overlay.appendChild(titulo);

    choices.forEach(upgrade => {
        const btn = document.createElement('button');
        btn.style.margin = '10px';
        btn.style.padding = '15px 20px';
        btn.style.fontSize = '16px';
        btn.style.backgroundColor = '#222';
        btn.style.color = '#0ff';
        btn.style.border = '2px solid #0ff';
        btn.style.borderRadius = '8px';
        btn.style.width = '85%';
        btn.style.maxWidth = '350px';
        
        btn.innerHTML = `<strong>${upgrade.name}</strong><br><small style="color:#aaa">${upgrade.desc}</small>`;
        
        btn.ontouchstart = (e) => { e.preventDefault(); selecionarUpgrade(upgrade.id, overlay); };
        btn.onclick = () => selecionarUpgrade(upgrade.id, overlay);

        overlay.appendChild(btn);
    });

    document.body.appendChild(overlay);
}

function selecionarUpgrade(upgradeId, overlay) {
    player.applyUpgrade(upgradeId);
    document.body.removeChild(overlay);
    isPaused = false;
}


