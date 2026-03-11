// Lista de perigos no chão (Fogo, Ácido, Explosões)
// O gameLoop vai precisar ler este array para dar dano e desenhar
export const hazards = []; 

export class Bullet {
    constructor(x, y, dirX, dirY, speed, damage, owner = 'player', type = 'comum', target = null) {
        this.x = x;
        this.y = y;
        
        // Direção base normalizada
        this.dirX = dirX;
        this.dirY = dirY;
        
        this.vx = dirX * speed;
        this.vy = dirY * speed;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner; // 'player' ou 'enemy'
        this.type = type;   // fogo, gelo, teleguiada, borracha, etc.
        this.target = target; // Usado para drone e teleguiada

        this.lifeTime = 0;
        this.maxLife = 2; // Tempo de vida padrão
        this.radius = 5;
        this.dead = false;
        this.bounces = 0; // Para bala de borracha

        // Variáveis de estado auxiliares baseadas no tipo
        this.baseX = x;
        this.baseY = y;
        this.startX = x;
        this.startY = y;
        this.trailTimer = 0;

        this.aplicarAtributosPorTipo();
    }

    aplicarAtributosPorTipo() {
        switch (this.type) {
            case 'gigante':
                this.radius = 40;
                this.speed *= 0.3; // Muito lenta
                this.damage = 9999; // Instakill
                break;
            case 'balinhas':
                this.radius = 2;
                this.damage *= 0.3;
                break;
            case 'bomba_relogio':
                this.maxLife = this.owner === 'player' ? 5 : 3;
                break;
            case 'bumerangue':
                this.maxLife = 1.5; // Vai e volta rápido
                break;
            case 'drone':
                this.maxLife = 60; // Dura 1 minuto
                this.radius = 10;
                break;
        }
    }

    update(dt, playerPos) {
        this.lifeTime += dt;
        
        if (this.lifeTime >= this.maxLife) {
            this.handleTimeout();
            return;
        }

        // --- COMPORTAMENTOS ESPECIAIS DE MOVIMENTO ---
        switch (this.type) {
            case 'seno':
                // Avança na linha base, mas oscila perpendicularmente
                this.baseX += this.vx * dt;
                this.baseY += this.vy * dt;
                let amplitude = 40;
                let freq = 15;
                let perpX = -this.dirY;
                let perpY = this.dirX;
                let oscilacao = Math.sin(this.lifeTime * freq) * amplitude;
                this.x = this.baseX + perpX * oscilacao;
                this.y = this.baseY + perpY * oscilacao;
                break;

            case 'bumerangue':
                // Forma de pétala (metade de lemniscata)
                // O progresso vai de 0 a 1 (0 = começo, 0.5 = ponta máxima, 1 = voltou)
                let progress = this.lifeTime / this.maxLife;
                let angle = progress * Math.PI; // 0 a PI
                let maxDist = this.speed * 0.8;
                
                // Distância avança e recua (senoide simples)
                let dist = Math.sin(angle) * maxDist;
                // Curvatura lateral para fazer o desenho da pétala (lóbulo)
                let lateral = Math.sin(angle * 2) * (maxDist * 0.3);

                let latX = -this.dirY;
                let latY = this.dirX;

                this.x = this.startX + (this.dirX * dist) + (latX * lateral);
                this.y = this.startY + (this.dirY * dist) + (latY * lateral);
                break;

            case 'teleguiada':
                if (this.target && !this.target.dead) {
                    // Curva lentamente na direção do alvo
                    let tx = this.target.x - this.x;
                    let ty = this.target.y - this.y;
                    let tLen = Math.hypot(tx, ty);
                    if (tLen > 0) {
                        // Força de curva (0.05 = curva suave estilo Piper)
                        this.dirX = this.dirX * 0.95 + (tx / tLen) * 0.05;
                        this.dirY = this.dirY * 0.95 + (ty / tLen) * 0.05;
                        // Renormaliza
                        let newLen = Math.hypot(this.dirX, this.dirY);
                        this.dirX /= newLen;
                        this.dirY /= newLen;
                        this.vx = this.dirX * this.speed;
                        this.vy = this.dirY * this.speed;
                    }
                }
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                break;

            default:
                // Movimento Retilíneo Padrão
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                break;
        }

        // --- EFEITOS CONTÍNUOS DURANTE O VOO ---
        if (this.type === 'fogo') {
            this.trailTimer += dt;
            if (this.trailTimer > 0.1) {
                // Deixa um rastro de fogo no chão que dura 1.5s
                hazards.push(new Hazard(this.x, this.y, 10, 1.5, this.damage * 0.2, 'fogo'));
                this.trailTimer = 0;
            }
        }
    }

    handleTimeout() {
        this.dead = true;
        if (this.type === 'bomba_relogio') {
            // Explode quando o tempo acaba!
            hazards.push(new Hazard(this.x, this.y, 60, 0.5, this.damage * 3, 'explosao'));
        }
    }

    // Chamado pelo gameLoop quando a bala acerta algo
    onHit(target) {
        if (this.type === 'bomba_relogio') {
            // Acertou antes do tempo? Dano pequeno e não explode.
            this.damage *= 0.2;
            this.dead = true;
        } else if (this.type === 'mina') {
            // Explode ao acertar!
            hazards.push(new Hazard(this.x, this.y, 50, 0.5, this.damage * 2, 'explosao'));
            this.dead = true;
        } else if (this.type === 'borracha') {
            this.bounces++;
            this.speed *= 1.3; // Fica mais rápida
            this.damage *= 1.5; // Fica mais forte
            
            // Efeito Sinuca: Reflete a bala usando um vetor simples de repulsão
            let nx = this.x - target.x;
            let ny = this.y - target.y;
            let nLen = Math.hypot(nx, ny);
            if (nLen > 0) {
                this.dirX = nx / nLen;
                this.dirY = ny / nLen;
                this.vx = this.dirX * this.speed;
                this.vy = this.dirY * this.speed;
            }
            if (this.bounces > 3) this.dead = true; // Limite de 3 quiques
        } else {
            this.dead = true; // Balas normais morrem ao bater
        }

        // Efeitos de status no alvo seriam aplicados aqui (Sangramento, Gelo, etc)
        // target.applyStatusEffect(this.type);
    }

    draw(ctx, camera, playerPos) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;

        let alpha = 1;
        if (this.type === 'invisivel' && playerPos) {
            // Fica mais visível quanto mais perto do jogador
            let distToPlayer = Math.hypot(this.x - playerPos.x, this.y - playerPos.y);
            alpha = Math.max(0, 1 - (distToPlayer / 300));
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Efeito visual do drone
        if (this.type === 'drone') {
            ctx.strokeStyle = "cyan";
            ctx.strokeRect(drawX - 12, drawY - 12, 24, 24);
        }
    }

    getColor() {
        switch (this.type) {
            case 'fogo': return 'orange';
            case 'gelo': return 'lightblue';
            case 'teleguiada': return 'magenta';
            case 'borracha': return 'pink';
            case 'bomba_relogio': return 'yellow';
            case 'shuriken': return 'silver';
            case 'gigante': return 'red';
            case 'invisivel': return 'rgba(255,255,255,0.8)';
            default: return 'white';
        }
    }
}

// ==========================================
// PROJÉTEIS LANÇADOS (PARABÓLICOS)
// ==========================================
export class LobbedProjectile {
    constructor(x, y, targetX, targetY, type = 'comum', damage = 20) {
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        
        this.type = type;
        this.damage = damage;
        
        // Posição visual atual
        this.x = x;
        this.y = y;
        this.z = 0; // Altura (para simular pulo)

        this.lifeTime = 0;
        this.flightTime = 1.5; // Tempo até cair no chão
        this.maxHeight = 150;  // Quão alto ele vai no arco
        this.dead = false;
        
        this.quiques = 0;
    }

    update(dt) {
        if (this.dead) return;
        this.lifeTime += dt;
        
        let progress = this.lifeTime / this.flightTime;

        if (progress >= 1) {
            this.aterrissar();
            return;
        }

        // Interpolação Linear (Lerp) para X e Y
        this.x = this.startX + (this.targetX - this.startX) * progress;
        this.y = this.startY + (this.targetY - this.startY) * progress;

        // Arco de seno para o eixo Z (Gravidade falsa)
        // progress vai de 0 a 1, então Math.PI vai de 0 a 180 graus (sobe e desce)
        this.z = Math.sin(progress * Math.PI) * this.maxHeight;
    }

    aterrissar() {
        // O que acontece quando bate no chão?
        switch (this.type) {
            case 'acido':
                // Cria poça de ácido que dura 3s
                hazards.push(new Hazard(this.targetX, this.targetY, 40, 3, this.damage * 0.5, 'acido'));
                this.dead = true;
                break;
            case 'bomba':
                // Bomba explode ao tocar
                hazards.push(new Hazard(this.targetX, this.targetY, 60, 0.5, this.damage * 2, 'explosao'));
                this.dead = true;
                break;
            case 'cola':
                // Poça que causa lentidão (a lógica de status fica no collision do gameLoop)
                hazards.push(new Hazard(this.targetX, this.targetY, 50, 2, this.damage, 'cola'));
                this.dead = true;
                break;
            case 'quicador':
                if (this.quiques < 2) {
                    this.quiques++;
                    this.lifeTime = 0;
                    this.flightTime = 0.5; // Quique mais rápido
                    this.maxHeight = 50;   // Quique mais baixo
                    this.startX = this.x;
                    this.startY = this.y;
                    // Calcula um novo alvo na mesma direção
                    let dx = this.targetX - this.startX;
                    let dy = this.targetY - this.startY;
                    this.targetX += dx * 0.5;
                    this.targetY += dy * 0.5;
                    // Dá dano na área atual
                    hazards.push(new Hazard(this.x, this.y, 25, 0.2, this.damage, 'explosao'));
                } else {
                    this.dead = true;
                }
                break;
            default:
                // Comum: Dano pequeno onde caiu
                hazards.push(new Hazard(this.targetX, this.targetY, 20, 0.2, this.damage, 'explosao'));
                this.dead = true;
                break;
        }
    }

    draw(ctx, camera) {
        // Ao desenhar, subtraímos Z do Y para simular altura em 2D
        let drawX = this.x - camera.x;
        let drawY = (this.y - this.z) - camera.y;

        // Desenha a sombra no chão (y real)
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        // A sombra diminui conforme a altura (Z) aumenta
        let shadowSize = Math.max(2, 10 - (this.z / 15));
        ctx.arc(this.x - camera.x, this.y - camera.y, shadowSize, 0, Math.PI * 2);
        ctx.fill();

        // Desenha o projétil no ar
        ctx.fillStyle = this.type === 'acido' ? 'lightgreen' : (this.type === 'bomba' ? 'darkred' : 'gray');
        ctx.beginPath();
        ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// ÁREAS DE PERIGO (HAZARDS)
// ==========================================
export class Hazard {
    constructor(x, y, radius, lifeTime, damagePerTick, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxLife = lifeTime;
        this.lifeTime = 0;
        this.damage = damagePerTick;
        this.type = type; // 'fogo', 'acido', 'explosao', 'cola'
        this.dead = false;
        
        // Cooldown para não dar dano mil vezes por segundo
        this.tickTimer = 0; 
    }

    update(dt) {
        this.lifeTime += dt;
        this.tickTimer += dt;
        if (this.lifeTime >= this.maxLife) {
            this.dead = true;
        }
    }

    // Retorna true se puder dar dano neste frame
    canDamage() {
        if (this.tickTimer > 0.5) { // Aplica dano a cada meio segundo
            this.tickTimer = 0;
            return true;
        }
        return false;
    }

    draw(ctx, camera) {
        let drawX = this.x - camera.x;
        let drawY = this.y - camera.y;
        
        // Faz a poça piscar ou desaparecer aos poucos
        let alpha = 1 - (this.lifeTime / this.maxLife);
        ctx.globalAlpha = Math.max(0, alpha * 0.5);

        if (this.type === 'fogo') ctx.fillStyle = 'orange';
        else if (this.type === 'acido') ctx.fillStyle = 'lime';
        else if (this.type === 'explosao') ctx.fillStyle = 'yellow';
        else if (this.type === 'cola') ctx.fillStyle = 'brown';

        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Lista para o sistema de sorteio de Upgrades no Player
export const SPECIAL_BULLETS_POOL = [
    'fogo', 'gelo', 'teleguiada', 'borracha', 'seno', 'bumerangue', 
    'shuriken', 'mina', 'gigante', 'balinhas', 'bomba_relogio'
];

