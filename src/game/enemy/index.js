import { getType } from './types/typeLoader.js';
import { RenderEnemy } from './systems/RenderSystem.js';
import { createStandardGun } from "../weapon/gun/types/standart-gun.js";
import { MathUtils } from "../../core/math.js";

/**
 * Classe Enemy: Representa uma entidade hostil.
 * Refatorada para suportar reciclagem de memória e otimização off-screen.
 */
export class Enemy {
    constructor(configOrX, y, typeName, level) {
        // Suporta tanto o construtor clássico quanto o objeto de configuração
        if (typeof configOrX === 'object') {
            this.init(configOrX);
        } else {
            this.init({ x: configOrX, y, typeName, level });
        }

        // Cache de contexto para evitar alocação de objetos no update
        this._cachedContext = {
            enemies: null,
            player: null,
            hazards: null,
            addProjectile: (p) => {
                this.bullets.push(p);
            }
        };
    }

    /**
     * 🔴 O SEGREDO DA RECICLAGEM: Reinicializa todas as propriedades.
     * Permite que um inimigo "morto" seja reusado como um novo monstro.
     */
    init(config) {
        // Define o tipo e estatísticas base
        this.type = typeof config.typeName === 'string' ? getType(config.typeName) : config.type;
        this.x = config.x;
        this.y = config.y;
        this.level = config.level || 1;

        const stats = this.type.stats;
        
        // Atributos de Vida
        this.maxHp = (stats.hp || 100) * (1 + (this.level - 1) * 0.2);
        this.hp = this.maxHp;
        
        // Atributos de Movimento
        this.speed = stats.speed || 200; // Velocidade máxima para o modo zumbi
        this.acceleration = stats.acceleration || 800;
        this.friction = 0.85;
        this.velX = 0;
        this.velY = 0;

        // Atributos de Combate
        this.baseMeleeDamage = (stats.meleeDamage || 10) * this.level;
        this.rangedDamage = (stats.rangedDamage || 5) * this.level;
        this.currentMeleeDamage = this.baseMeleeDamage;

        // Estado e Timers
        this.dead = false;
        this.bullets = []; 
        this.dodgeCheckTimer = 0;
        this.meleeCooldown = 0;
        this.thinkTimer = Math.random() * 0.2; 
        this.lastMoveIntent = { x: 0, y: 0 };

        // Reinicializa/Equipa a Arma
        this.weapon = createStandardGun({
            bulletColor: config.bulletColor || '#ff4444',
            reloadTime: stats.reloadTime || 2.5,
            maxSlots: stats.maxAmmo || 3,
            burstDelay: stats.fireRate || 0.2
        });
        this.weapon.equip(this);
        
        this.color = stats.color || '#ff0000';
        this.radius = stats.radius || 25;
    }

    update(dt, player, allEnemies, hazards) {
        if (this.dead) return;

        // 1. Cálculo de Distância até o Jogador
        const distSq = MathUtils.distSq(this.x, this.y, player.x, player.y);
        
        // Definição do anel de atividade (fora deste raio, entra em modo econômico)
        const OFFSCREEN_RADIUS_SQ = 1200 * 1200; 

        // 🔴 MODO ZUMBI (Otimização Extrema para Off-Screen)
        if (distSq > OFFSCREEN_RADIUS_SQ) {
            // Movimento direto e linear para o jogador (Gasta quase zero de CPU)
            const dir = MathUtils.getDir(this.x, this.y, player.x, player.y);
            this.x += dir.x * this.speed * dt;
            this.y += dir.y * this.speed * dt;
            
            // "Gambiarra" de Combate: Transfere o poder de fogo para o dano de contato
            this.currentMeleeDamage = this.baseMeleeDamage + this.rangedDamage;
            
            // 🛑 INTERROMPE O UPDATE: Pula IA, esquiva, recarga e tiros.
            return; 
        }

        // 🟢 MODO INTELIGENTE (Inimigo visível ou próximo)
        this.currentMeleeDamage = this.baseMeleeDamage; // Dano volta ao normal

        if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
        if (this.dodgeCheckTimer > 0) this.dodgeCheckTimer -= dt;

        // Lógica de IA Preguiçosa (Buffer de pensamento)
        this.thinkTimer -= dt;
        if (this.thinkTimer <= 0) {
            this._cachedContext.enemies = allEnemies;
            this._cachedContext.player = player;
            this._cachedContext.hazards = hazards;

            const moveIntent = this.type.think(this, dt, player, allEnemies, hazards);
            if (moveIntent) {
                this.lastMoveIntent.x = moveIntent.x;
                this.lastMoveIntent.y = moveIntent.y;
            }
            this.thinkTimer = 0.5; // Pensa apenas 2 vezes por segundo
        }

        // Update da Arma e Projéteis (Apenas na tela)
        if (this.weapon) {
            this.weapon.update(dt, this._cachedContext);
        }

        // Física e Movimentação Baseada no Último Intento
        this.velX += this.lastMoveIntent.x * this.acceleration * dt;
        this.velY += this.lastMoveIntent.y * this.acceleration * dt;

        this.velX *= this.friction;
        this.velY *= this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        this.updateBullets(dt, player);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }

    updateBullets(dt, player) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, player);
            if (b.dead) this.bullets.splice(i, 1);
        }
    }

    draw(ctx, camera) {
        RenderEnemy(ctx, camera, this);
    }

    getDistSq(target) {
        return MathUtils.distSq(this.x, this.y, target.x, target.y);
    }
}

