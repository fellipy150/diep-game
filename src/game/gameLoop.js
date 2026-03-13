import { player, enemies, gerenciarSpawns } from "../main.js";
import { updateCamera, renderGame, camera } from "./renderer.js";
import { hazards } from "../entities/projectiles/Projectile.js";

let lastTime = 0;
export let isPaused = false;
export let isGameOver = false;
const damageNumbers = [];

// OTIMIZAÇÃO: Cache do Canvas e do Contexto na raiz do módulo
const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

export function startGameLoop() {
    player.onLevelUp = (choices) => { isPaused = true; mostrarMenuLevelUp(choices); };
    requestAnimationFrame(loop);
}

function loop(time) {
    let dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    if (!isPaused && !isGameOver) update(dt);
    updateCamera(player);
    renderGame(player, enemies, hazards, damageNumbers);
    if (isGameOver) desenharGameOver();
    requestAnimationFrame(loop);
}

function update(dt) {
    player.update(dt);
    gerenciarSpawns(dt);

    // CORREÇÃO: Temporizador atrelado ao game loop (dt) para o player
    if (player.efeitoColaTimer > 0) {
        player.efeitoColaTimer -= dt;
        if (player.efeitoColaTimer <= 0) player.speedMultiplicador = 1.0;
    }

    // OTIMIZAÇÃO: Cleanup in-place de damage numbers sem alocar novos arrays
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        let n = damageNumbers[i];
        n.y -= 40 * dt; 
        n.life -= dt;
        if (n.life <= 0) damageNumbers.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        // CORREÇÃO: Temporizador atrelado ao game loop (dt) para inimigos
        if (e.efeitoColaTimer > 0) {
            e.efeitoColaTimer -= dt;
            if (e.efeitoColaTimer <= 0) e.speedMultiplicador = 1.0;
        }

        if (e.dead) {
            enemies.splice(i, 1);
            player.gainXp(40);
        } else {
            // OTIMIZAÇÃO: Removido 'allBullets' para evitar criação de array via flatMap no loop
            e.update(dt, player, enemies);
        }
    }

    for (let i = hazards.length - 1; i >= 0; i--) {
        hazards[i].update(dt);
        if (hazards[i].dead) hazards.splice(i, 1);
    }

    processarColisoes();
    
    // OTIMIZAÇÃO: Limpeza de arrays in-place substituindo o .filter()
    limparListaInPlace(player.bullets);
    for (let e of enemies) limparListaInPlace(e.bullets);

    if (player.hp <= 0) isGameOver = true;
}

// OTIMIZAÇÃO: Helper para mutar arrays sem gerar Garbage Collection
function limparListaInPlace(lista) {
    if (!lista) return;
    for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].dead) lista.splice(i, 1);
    }
}

// OTIMIZAÇÃO: Verificação rápida usando Distância ao Quadrado (Squared Distance)
const verificarColisao = (o1, o2) => {
    let dx = o1.x - o2.x;
    let dy = o1.y - o2.y;
    let rSum = o1.radius + o2.radius;
    return (dx * dx + dy * dy) < (rSum * rSum);
};

const criarNumeroDano = (x, y, val, color) => damageNumbers.push({ x, y: y - 20, val: Math.floor(val), life: 1.0, color });

// CORREÇÃO: Sem setTimeout. Configuramos apenas o multiplicador e a vida do temporizador.
const aplicarEfeitoDeSolo = (entidade, tipo) => {
    if (tipo === 'cola') { 
        entidade.speedMultiplicador = 0.3; 
        entidade.efeitoColaTimer = 2.0; 
    }
};

function resolverSobreposicao(o1, o2, dx, dy, distSq, minDist) {
    let dist = Math.sqrt(distSq);
    if (dist === 0) return;
    let overlap = (minDist - dist) / 2;
    let nx = dx / dist;
    let ny = dy / dist;
    
    // Ajeita as posições empurrando nas direções opostas
    o1.x += nx * overlap; o1.y += ny * overlap;
    o2.x -= nx * overlap; o2.y -= ny * overlap;
}

function processarColisoes() {
    // Colisões Inimigo-Player e Inimigo-Inimigo otimizadas
    for (let i = 0; i < enemies.length; i++) {
        let e1 = enemies[i];
        if (e1.dead) continue;
        
        let dxP = player.x - e1.x;
        let dyP = player.y - e1.y;
        let distSqP = dxP * dxP + dyP * dyP;
        let minDistP = player.radius + e1.radius;
        
        if (distSqP < minDistP * minDistP) {
            resolverSobreposicao(player, e1, dxP, dyP, distSqP, minDistP);
            if (e1.aiType === 'melee' && e1.meleeCooldown <= 0) {
                player.hp -= 20; e1.meleeCooldown = 1.0;
                aplicarEfeitoDeSolo(player, 'impact');
                camera.shake = 10; criarNumeroDano(player.x, player.y, 20, "red");
            }
        }
        
        for (let j = i + 1; j < enemies.length; j++) {
            let e2 = enemies[j];
            if (e2.dead) continue;
            let dxE = e1.x - e2.x;
            let dyE = e1.y - e2.y;
            let distSqE = dxE * dxE + dyE * dyE;
            let minDistE = e1.radius + e2.radius;
            
            if (distSqE < minDistE * minDistE) {
                resolverSobreposicao(e1, e2, dxE, dyE, distSqE, minDistE);
            }
        }
    }
    
    // As verificações de balas e hazards agora utilizam a nova verificarColisao (Squared Distance)
    for (let b of player.bullets) {
        if (b.dead) continue;
        for (let e of enemies) {
            if (!e.dead && verificarColisao(b, e)) {
                e.takeDamage(b.damage); camera.shake = 8;
                criarNumeroDano(e.x, e.y, b.damage, "white");
                b.onHit(e); if (b.dead) break;
            }
        }
    }
    
    for (let atirador of enemies) {
        for (let b of atirador.bullets) {
            if (b.dead || !b.radius) continue;
            if (verificarColisao(b, player)) {
                player.hp -= b.damage; camera.shake = 12;
                criarNumeroDano(player.x, player.y, b.damage, "red");
                b.onHit(player); continue;
            }
            for (let vitima of enemies) {
                if (atirador !== vitima && !vitima.dead && verificarColisao(b, vitima)) {
                    vitima.takeDamage(b.damage); criarNumeroDano(vitima.x, vitima.y, b.damage, "white");
                    b.onHit(vitima); break;
                }
            }
        }
    }
    
    for (let h of hazards) {
        if (!h.dead && h.canDamage()) {
            const hObj = { x: h.x, y: h.y, radius: h.radius };
            if (verificarColisao(hObj, player)) {
                player.hp -= h.damage; criarNumeroDano(player.x, player.y, h.damage, "red");
                aplicarEfeitoDeSolo(player, h.type);
            }
            for (let e of enemies) {
                if (!e.dead && verificarColisao(hObj, e)) {
                    e.takeDamage(h.damage); criarNumeroDano(e.x, e.y, h.damage, "white");
                    aplicarEfeitoDeSolo(e, h.type);
                }
            }
        }
    }
}

// CORREÇÃO: Uso de variável ctx cacheadas em vez de buscar o contexto todo frame
function desenharGameOver() {
    if (!ctx) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "red"; 
    ctx.font = "bold 40px sans-serif"; 
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", cx, cy - 20);
    
    ctx.fillStyle = "white"; 
    ctx.font = "20px sans-serif";
    ctx.fillText(`You reached Level ${player.level}`, cx, cy + 30);
    ctx.fillText("Reload the page to try again", cx, cy + 70);
}

function mostrarMenuLevelUp(choices) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: '100', color: 'white', fontFamily: 'sans-serif'
    });
    overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) { e.stopPropagation(); e.preventDefault(); } });
    
    const titulo = document.createElement('h1');
    titulo.innerText = `Level ${player.level}! Choose an Upgrade:`;
    titulo.style.marginBottom = '20px';
    overlay.appendChild(titulo);
    
    choices.forEach(upgrade => {
        const btn = document.createElement('button');
        Object.assign(btn.style, {
            margin: '8px', padding: '12px', backgroundColor: '#111', color: '#0ff',
            border: '1px solid #0ff', borderRadius: '4px', width: '300px', cursor: 'pointer'
        });
        btn.innerHTML = `<strong>${upgrade.name}</strong><br><small style="color:#aaa">${upgrade.description}</small>`;
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); selecionarUpgrade(upgrade.id, overlay); });
        overlay.appendChild(btn);
    });
    document.body.appendChild(overlay);
}

function selecionarUpgrade(upgradeId, overlay) {
    player.applyUpgrade(upgradeId);
    if (overlay?.parentNode) document.body.removeChild(overlay);
    isPaused = false;
}
