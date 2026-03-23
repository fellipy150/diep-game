import { MathUtils } from "../../core/math.js";
import { applyDamage } from "./Combat.js";
import { ProjectilePool } from "../projectiles/ProjectilePool.js";
import { updateStatusEffects, StatSheet } from './status.js';
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input/index.js";
import { createStandardGun } from "../weapon/gun/types/standart-gun.js";
import { GameContext } from "../weapon/base/GameContext.js";
import { Inventory } from "../weapon/base/Inventory.js";
import { DOMManager } from "../ui/DOMManager.js";
import { fastRemove } from "../state.js"; // Garanta que o caminho está correto no seu projeto

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.radius = 20;
        this.baseAcceleration = 1400;
        this.friction = 0.88;
        this.visualRotation = 0;
        
        this.stats = new StatSheet({
            maxHp: 200,
            speed: 1.0,
            damage: 40,
            fireRate: 0.6,
            bulletSpeed: 500,
            multiShot: 1
        });

        this.hp = this.stats.get('maxHp');
        this.activeEffects = [];
        this.bullets = [];
        this.lockedTarget = null;
        this.lockOnTimer = 0;
        
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = new Set();

        // Inicializa Inventário com Peso
        this.inventory = new Inventory(this, 1);
        const startingGun = createStandardGun();
        startingGun.weight = 1; 
        this.inventory.addWeapon(startingGun);

        // Contexto persistente para evitar GC
        this._cachedContext = new GameContext({ 
            player: this, 
            enemies: [], 
            hazards: [] 
        });
    }

    // Getters de Stats
    get damage() { return this.stats.get('damage'); }
    get fireRate() { return this.stats.get('fireRate'); }
    get speed() { return this.stats.get('speed'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get bulletSpeed() { return this.stats.get('bulletSpeed'); }
    get multiShot() { return this.stats.get('multiShot'); }

    findNearestTarget(context) {
        let nearest = null;
        let minDistSq = Infinity;
        const enemies = context.enemies;
        if (enemies) {
            for (let i = 0; i < enemies.length; i++) {
                const t = enemies[i];
                if (t.dead) continue;
                const distSq = MathUtils.distSq(this.x, this.y, t.x, t.y);
                if (distSq < minDistSq) { minDistSq = distSq; nearest = t; }
            }
        }
        return nearest;
    }

    update(dt, gameState) {
        updateStatusEffects(this, dt);

        // --- 1. MOVIMENTAÇÃO ---
        let dirX = input.move.x || 0;
        let dirY = input.move.y || 0;
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) { dirX /= mag; dirY /= mag; }

        const acc = this.baseAcceleration * this.speed;
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Rotação Visual (Movimento)
        if (Math.hypot(this.velX, this.velY) > 10) {
            const moveAngle = Math.atan2(this.velY, this.velX);
            let diff = moveAngle - this.visualRotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.visualRotation += diff * 0.15;
        }

        // --- 2. LIMPEZA DE BALAS (FastRemove) ---
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.dead) {
                ProjectilePool.release(b);
                fastRemove(this.bullets, i);
            } else {
                b.update(dt);
            }
        }

        if (this.lockOnTimer > 0) {
            this.lockOnTimer -= dt;
            if (this.lockOnTimer <= 0) this.lockedTarget = null;
        }

        // --- 3. ATUALIZAÇÃO DO CONTEXTO E INVENTÁRIO ---
        this._cachedContext.enemies = gameState.enemies;
        this._cachedContext.hazards = gameState.hazards;
        this._cachedContext.player = this;
        this._cachedContext.bullets = this.bullets; // Fundamental para a arma criar a bala!
        this._cachedContext.dt = dt;
        
        // Mantém os cooldowns rodando, mas não atira automaticamente
        this.inventory.update(dt, this._cachedContext);

        // --- 4. LÓGICA DE TIRO (SOLTAR PARA ATIRAR) ---
        if (input.fireReleased) {
            const activeWeapon = this.inventory.getActiveWeapon();
            
            if (activeWeapon) {
                // Pega a última direção apontada pelo joystick antes de soltar
                let aimDir = { x: input.lastAim.x, y: input.lastAim.y };

                // Se foi um "Tap" (toque rápido), tenta auto-mira
                if (input.isTap) {
                    const target = this.findNearestTarget(this._cachedContext);
                    if (target) {
                        const dir = MathUtils.getDir(this.x, this.y, target.x, target.y);
                        aimDir = { x: dir.x, y: dir.y };
                        this.lockedTarget = target;
                        this.lockOnTimer = 1.5;
                        input.lastAim = { ...aimDir }; // Salva para o próximo tiro
                    }
                }

                // EXECUTA O TIRO SOMENTE AGORA (Se a direção não for nula)
                if (aimDir && (aimDir.x !== 0 || aimDir.y !== 0)) {
                    const fired = activeWeapon.executeFire(this._cachedContext, aimDir);
                    if (fired) {
                        this.visualRotation = Math.atan2(aimDir.y, aimDir.x);
                        if (this.onShootEffect) this.onShootEffect(this);
                    }
                }
            }
            
            // Reseta a flag para o próximo quadro
            input.fireReleased = false;
        }

        // --- 5. TROCA DE ARMA (Input Físico) ---
        if (input.fireSwap) {
            if (this.inventory.weapons.length > 1) {
                const nextIndex = (this.inventory.activeIndex + 1) % this.inventory.weapons.length;
                this.inventory.equip(nextIndex);
                if (window.DOMManager) window.DOMManager.updateHotbar(this.inventory);
            }
            input.fireSwap = false;
        }
    }

    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }
    
    takeDamage(amount) { applyDamage(this, amount); }
    addXp(amount) { gainXp(this, amount); }
    giveUpgrade(upgradeId) { return applyUpgrade(this, upgradeId); }
}


