import { player, enemies, gerenciarSpawns } from "./main.js";
import { updateCamera, renderGame, camera } from "./renderer.js";
import { hazards } from "./bullet.js";

let lastTime = 0;
export let isPaused = false;
export let isGameOver = false;
const damageNumbers = [];

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
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        let n = damageNumbers[i];
        n.y -= 40 * dt; n.life -= dt;
        if (n.life <= 0) damageNumbers.splice(i, 1);
    }
    let allBullets = [...player.bullets, ...enemies.flatMap(e => e.bullets)];
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.dead ? (enemies.splice(i, 1), player.gainXp(40)) : e.update(dt, player, enemies, allBullets);
    }
    for (let i = hazards.length - 1; i >= 0; i--) {
        hazards[i].update(dt);
        if (hazards[i].dead) hazards.splice(i, 1);
    }
    processarColisoes();
    if (player.hp <= 0) isGameOver = true;
}

const verificarColisao = (o1, o2) => Math.hypot(o1.x - o2.x, o1.y - o2.y) < (o1.radius + o2.radius);
const criarNumeroDano = (x, y, val, color) => damageNumbers.push({ x, y: y - 20, val: Math.floor(val), life: 1.0, color });
const aplicarEfeitoDeSolo = (entidade, tipo) => {
    if (tipo === 'cola') { entidade.speedMultiplicador = 0.3; setTimeout(() => entidade.speedMultiplicador = 1.0, 2000); }
};

function resolverSobreposicao(o1, o2, dist, minDist) {
    let overlap = (minDist - dist) / 2, nx = (o1.x - o2.x) / dist || 1, ny = (o1.y - o2.y) / dist || 0;
    o1.x += nx * overlap; o1.y += ny * overlap;
    o2.x -= nx * overlap; o2.y -= ny * overlap;
}

function processarColisoes() {
    for (let i = 0; i < enemies.length; i++) {
        let e1 = enemies[i];
        if (e1.dead) continue;
        let distP = Math.hypot(player.x - e1.x, player.y - e1.y), minDistP = player.radius + e1.radius;
        if (distP < minDistP) {
            resolverSobreposicao(player, e1, distP, minDistP);
            if (e1.aiType === 'melee' && e1.meleeCooldown <= 0) {
                player.hp -= 20; e1.meleeCooldown = 1.0;
                aplicarEfeitoDeSolo(player, 'impact');
                camera.shake = 10; criarNumeroDano(player.x, player.y, 20, "red");
            }
        }
        for (let j = i + 1; j < enemies.length; j++) {
            let e2 = enemies[j];
            if (e2.dead) continue;
            let distE = Math.hypot(e1.x - e2.x, e1.y - e2.y), minDistE = e1.radius + e2.radius;
            if (distE < minDistE) resolverSobreposicao(e1, e2, distE, minDistE);
        }
    }
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
    player.bullets = player.bullets.filter(b => !b.dead);
    enemies.forEach(e => e.bullets = e.bullets.filter(b => !b.dead));
}

function desenharGameOver() {
    const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red"; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", cx, cy - 20);
    ctx.fillStyle = "white"; ctx.font = "20px sans-serif";
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
