/**
 * Classe base para todos os projéteis do jogo.
 * Refatorada para suportar inicialização dinâmica (Pooling).
 */
export class Bullet {
    constructor(config) {
        // O construtor agora é apenas um túnel para o init
        this.init(config);
    }

    /**
     * Inicializa ou reseta as propriedades da bala.
     * @param {Object} config - Configurações do disparo (origem, velocidade, dano, etc).
     */
    init(config) {
        // Atribui propriedades básicas (x, y, vx, vy, speed, damage, source, etc)
        Object.assign(this, config); 
        
        this.radius = config.radius || 5;
        this.color = config.color || '#fff';
        this.dead = false;
        this.life = config.life || 2.0; // Tempo de vida em segundos
        
        this.effects = config.effects || [];
        this.bounces = config.bounces || 0;
        this.pierceCount = config.pierceCount || 0;
    }

    /**
     * Atualiza a física do projétil.
     */
    update(dt) {
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
        }
    }

    /**
     * Renderização legada (será substituída na Fase 4 por Renderers especializados).
     */
    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Lógica disparada ao colidir com uma entidade.
     */
    onHit(target, context) {
        // Se a bala não tiver perfuração (pierceCount), ela morre no impacto
        if (this.pierceCount <= 0) {
            this.dead = true;
        } else {
            this.pierceCount--;
        }

        // Processa efeitos especiais (Fogo, Gelo, Sinergias)
        for (const effect of this.effects) {
            if (effect.onHit) {
                const handled = effect.onHit(this, target, context);
                if (handled) break; // Alguns efeitos podem consumir o impacto
            }
        }
    }
}

/**
 * Projétil que se move em arco ou direção fixa até um ponto alvo.
 */
export class LobbedProjectile extends Bullet {
    constructor(config) {
        super(config);
    }

    init(config) {
        super.init(config);
        this.targetX = config.targetX || this.x;
        this.targetY = config.targetY || this.y;
        this.speed = config.speed || 400;
    }

    update(dt) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        // Se chegar perto do alvo, "explode" (morre)
        if (dist < 10) {
            this.dead = true;
        } else {
            // Move-se em linha reta em direção ao alvo
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
}

