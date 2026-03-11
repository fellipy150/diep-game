import { Bullet, LobbedProjectile } from "./bullet.js";
import { getSmartAim } from "./predict.js";

export class Enemy {
    constructor(x, y, aiType = 'agressivo', bulletType = 'comum') {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.dead = false;

        // Atributos base
        // Vida entre 100 e 500
        this.maxHp = Math.floor(Math.random() * 401) + 100;
        this.hp = this.maxHp;
        
        this.aiType = aiType; // 'agressivo', 'perdido', 'sniper', 'estrategico', 'corpo_a_corpo', 'cura'
        this.bulletType = bulletType;
        
        this.speed = 120;
        this.bullets = [];
        this.target = null; // O alvo atual (Pode ser o Jogador ou outro Inimigo)

        // Tempos e Cooldowns
        this.shootCooldown = 0;
        this.fireRate = 1.5; // Atira a cada 1.5s
        this.timeSinceLastDamage = 0;
        this.timeSinceLastShot = 0;

        // Variáveis de Estado da I.A.
        this.randomMoveDir = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        this.randomMoveTimer = 0;
        this.dodgeVector = { x: 0, y: 0 };
        this.dodgeTimer = 0;

        this.aplicarAtributosPorIA();
    }

    aplicarAtributosPorIA() {
        // Ajusta status com base na classe do inimigo
        switch (this.aiType) {
            case 'sniper':
                this.speed = 90; // Mais lento que o jogador
                this.fireRate = 2.5; // Demora mais a atirar, mas mira muito bem
                break;
            case 'corpo_a_corpo':
                this.speed = 200; // Ligeiramente mais rápido que o jogador (assumindo que o jogador tem 180)
                this.maxHp = 100; // Pouca vida
                this.hp = this.maxHp;
                break;
            case 'cura':
                this.speed = 160;
                break;
        }
    }

    // Recebe dano e zera o tempo de cura
    takeDamage(amount) {
        this.hp -= amount;
        this.timeSinceLastDamage = 0;
        if (this.hp <= 0) {
            this.dead = true;
        }
    }

    update(dt, player, allEnemies, allBullets) {
        if (this.dead) return;

        // Atualiza os temporizadores de estado
        this.timeSinceLastDamage += dt;
        this.timeSinceLastShot += dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.dodgeTimer > 0) this.dodgeTimer -= dt;

        // 1. SISTEMA DE CURA PASSIVA
        // Se não atirar e não receber dano em 3 segundos, cura 10% da vida máxima por segundo.
        if (this.timeSinceLastDamage > 3 && this.timeSinceLastShot > 3) {
            this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.10 * dt));
        }

        // 2. SELEÇÃO DE ALVO (PvEvE)
        // Procura a entidade mais próxima (Jogador ou outro Inimigo)
        this.selecionarAlvo(player, allEnemies);

        // 3. MOVIMENTO E INTELIGÊNCIA ARTIFICIAL
        this.atualizarMovimento(dt, allBullets);

        // 4. SISTEMA DE TIRO
        this.atualizarTiro();

        // 5. Atualiza as próprias balas
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.update(dt);
            // Remove se morreu ou o tempo acabou
            if (b.dead || b.lifeTime > b.maxLife) {
                this.bullets.splice(i, 1);
            }
        }
    }

    selecionarAlvo(player, allEnemies) {
        if (this.aiType === 'cura') {
            this.target = null; // O modo cura não quer focar em ninguém para atacar
            return;
        }

        let alvoMaisProximo = player;
        let menorDistancia = Math.hypot(player.x - this.x, player.y - this.y);

        // Verifica todos os outros inimigos
        for (let outroInimigo of allEnemies) {
            if (outroInimigo === this || outroInimigo.dead) continue; // Ignora a si mesmo e mortos
            
            let dist = Math.hypot(outroInimigo.x - this.x, outroInimigo.y - this.y);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                alvoMaisProximo = outroInimigo;
            }
        }

        this.target = alvoMaisProximo;
    }

    atualizarMovimento(dt, allBullets) {
        let moveX = 0;
        let moveY = 0;

        // --- SISTEMA DE DESVIO GLOBAL (75% de chance) ---
        // Se não estiver em cooldown de desvio, procura balas perigosas
        if (this.dodgeTimer <= 0) {
            for (let b of allBullets) {
                // Ignora balas criadas por este próprio inimigo
                if (b.sender === this || b.owner === this) continue;

                let distToBullet = Math.hypot(b.x - this.x, b.y - this.y);
                // Se uma bala estiver a menos de 120 pixels
                if (distToBullet < 120) {
                    // 75% de chance de ativar o reflexo de desvio
                    if (Math.random() < 0.75) {
                        // Desvia na perpendicular da direção da bala
                        this.dodgeVector = { x: -b.vy, y: b.vx }; 
                        this.dodgeTimer = 0.5; // Fica a desviar-se por 0.5 segundos
                    } else {
                        // Se falhou os 75%, não tenta desviar dessa bala tão cedo
                        this.dodgeTimer = 0.5; 
                    }
                    break; // Só reage a uma bala de cada vez
                }
            }
        }

        // Se estiver a desviar, sobrepõe a I.A normal
        if (this.dodgeTimer > 0 && (this.dodgeVector.x !== 0 || this.dodgeVector.y !== 0)) {
            moveX = this.dodgeVector.x;
            moveY = this.dodgeVector.y;
        } else {
            // --- I.A DE MOVIMENTAÇÃO ESPECÍFICA ---
            if (this.aiType === 'perdido') {
                this.randomMoveTimer -= dt;
                if (this.randomMoveTimer <= 0) {
                    let angle = Math.random() * Math.PI * 2;
                    this.randomMoveDir = { x: Math.cos(angle), y: Math.sin(angle) };
                    this.randomMoveTimer = 1 + Math.random() * 2; // Troca de direção a cada 1~3s
                }
                moveX = this.randomMoveDir.x;
                moveY = this.randomMoveDir.y;
            } 
            else if (this.aiType === 'cura') {
                // Foge de TUDO (Escolhemos afastar-se do jogador como base, ou afastar do centro de massa do combate)
                let angleToPlayer = Math.atan2(this.y - player.y, this.x - player.x);
                moveX = Math.cos(angleToPlayer);
                moveY = Math.sin(angleToPlayer);
            }
            else if (this.target) {
                let dx = this.target.x - this.x;
                let dy = this.target.y - this.y;
                let distToTarget = Math.hypot(dx, dy);
                let dirX = distToTarget === 0 ? 0 : dx / distToTarget;
                let dirY = distToTarget === 0 ? 0 : dy / distToTarget;

                switch (this.aiType) {
                    case 'agressivo':
                    case 'corpo_a_corpo':
                        // Vai direto para cima do alvo
                        moveX = dirX;
                        moveY = dirY;
                        break;
                    
                    case 'sniper':
                        // Quer ficar fora da tela (> 400px de distância)
                        if (distToTarget < 400) {
                            moveX = -dirX; // Foge
                            moveY = -dirY;
                        } else if (distToTarget > 600) {
                            moveX = dirX;  // Aproxima-se lentamente se estiver longe demais
                            moveY = dirY;
                        }
                        break;
                    
                    case 'estrategico':
                        // Tenta manter-se exatamente a 250px de distância
                        if (distToTarget < 200) {
                            moveX = -dirX; // Afasta-se
                            moveY = -dirY;
                        } else if (distToTarget > 300) {
                            moveX = dirX;  // Aproxima-se
                            moveY = dirY;
                        } else {
                            // "Strafe" - Anda de lado ao redor do alvo
                            moveX = -dirY; 
                            moveY = dirX;
                        }
                        break;
                }
            }
        }

        // Normaliza o vetor de movimento para não andar mais rápido nas diagonais
        let length = Math.hypot(moveX, moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }

        // Aplica o movimento
        this.x += moveX * this.speed * dt;
        this.y += moveY * this.speed * dt;
    }

    atualizarTiro() {
        // Se for corpo a corpo, modo cura ou não tiver alvo, não atira.
        if (this.aiType === 'corpo_a_corpo' || this.aiType === 'cura' || !this.target) return;

        // Se estiver em cooldown ou muito longe, não atira.
        let dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (this.shootCooldown > 0 || dist > 800) return;

        // Base da matemática de tiro (SmartAim)
        let bulletSpeed = 300;
        let baseDamage = 25;
        let targetVel = { x: this.target.velX || 0, y: this.target.velY || 0 }; // Segurança se o alvo não tiver velX

        // Obtém a direção de tiro inteligente
        let aim = getSmartAim(
            { x: this.x, y: this.y },
            { x: this.target.x, y: this.target.y },
            targetVel,
            bulletSpeed,
            this.bulletType,
            this.target.radius || 20
        );

        if (!aim) return; // Se a matemática disser que é impossível acertar, não gasta munição

        // Dispara o projétil apropriado
        const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
        if (lobbedTypes.includes(this.bulletType)) {
            // Projétil Lançado em Arco
            this.bullets.push(new LobbedProjectile(
                this.x, this.y, 
                aim.targetX, aim.targetY, 
                this.bulletType, baseDamage
            ));
        } else {
            // Tiro Direto
            let newBullet = new Bullet(
                this.x, this.y, 
                aim.x, aim.y, 
                bulletSpeed, baseDamage, 
                'enemy', this.bulletType, this.target
            );
            newBullet.sender = this; // Identifica quem atirou para o sistema de desvio não fugir do próprio tiro
            this.bullets.push(newBullet);
        }

        this.shootCooldown = this.fireRate;
        this.timeSinceLastShot = 0; // Zera o temporizador de cura passiva
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        // 1. Desenha as balas deste inimigo
        for (let b of this.bullets) {
            b.draw(ctx, camera, player); // Passamos o player caso a bala seja invisível
        }

        // 2. Cor do Inimigo baseada na I.A
        ctx.fillStyle = this.getCorPorIA();
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Desenha os Olhos/Direção (para saber para onde ele está a olhar)
        if (this.target) {
            let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(drawX + Math.cos(angle)*10, drawY + Math.sin(angle)*10, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Barra de Vida Visual
        let hpRatio = this.hp / this.maxHp;
        ctx.fillStyle = "red";
        ctx.fillRect(drawX - 20, drawY - 35, 40, 5);
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(drawX - 20, drawY - 35, 40 * hpRatio, 5);
    }

    getCorPorIA() {
        switch(this.aiType) {
            case 'agressivo': return '#ff3333';     // Vermelho Vivo
            case 'sniper': return '#cc00ff';        // Roxo
            case 'estrategico': return '#ffaa00';   // Laranja
            case 'corpo_a_corpo': return '#880000'; // Vermelho Escuro
            case 'cura': return '#00ff88';          // Verde
            case 'perdido': return '#888888';       // Cinza
            default: return 'red';
        }
    }
}

