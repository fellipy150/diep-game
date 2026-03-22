import { MathUtils } from "../../core/math.js";
import { ProjectilePool } from "../projectiles/ProjectilePool.js";
import { handleShooting, applyDamage } from "./Combat.js";
import { updateStatusEffects, StatSheet } from './status.js';
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input/index.js";
import { createStandardGun } from "../weapon/gun/types/standart-gun.js";
import { GameContext } from "../weapon/base/GameContext.js";
import { WeaponLoadout } from "../weapon/base/WeaponLoadout.js";

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

        // --- SISTEMA DE STATUS ---
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

        // --- PROGRESSÃO ---
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = new Set();

        // --- EQUIPAMENTO ---
        this.loadout = new WeaponLoadout(this, 2);
        const startingGun = createStandardGun();
        this.loadout.addWeapon(startingGun, 1);

        
        // 🟢 COMO CORRIGIR (Passe o gameState como um objeto simulado):
        // O gameState só passa a existir quando o jogo roda, 
        // então iniciamos o cache com um estado limpo.
        this._cachedContext = new GameContext({ player: this, enemies: [], hazards: [] });
        
    }

    // --- API DE STATUS ---
    get damage() { return this.stats.get('damage'); }
    get fireRate() { return this.stats.get('fireRate'); }
    get speed() { return this.stats.get('speed'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get bulletSpeed() { return this.stats.get('bulletSpeed'); }
    get multiShot() { return this.stats.get('multiShot'); }

    /**
     * Busca o alvo mais próximo sem criar novos arrays (Zero Alocação)
     * e usando distância ao quadrado para máxima performance.
     */
    findNearestTarget(context) {
        let nearest = null;
        let minDistSq = Infinity;

        // 1. Processa Inimigos (Loop direto no array original)
        const enemies = context.enemies;
        if (enemies) {
            for (let i = 0; i < enemies.length; i++) {
                const t = enemies[i];
                if (t.dead) continue;

                const distSq = MathUtils.distSq(this.x, this.y, t.x, t.y);
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearest = t;
                }
            }
        }

        // 2. Processa Hazards (Se houver perigos que podem ser alvos)
        const hazards = context.hazards;
        if (hazards) {
            for (let i = 0; i < hazards.length; i++) {
                const h = hazards[i];
                if (h.dead || !h.isTargetable) continue;

                const distSq = MathUtils.distSq(this.x, this.y, h.x, h.y);
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearest = h;
                }
            }
        }

        return nearest;
    }

    update(dt, gameState) {
        updateStatusEffects(this, dt);

        // Movimentação
        let dirX = input.move.x;
        let dirY = input.move.y;
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) {
            dirX /= mag;
            dirY /= mag;
        }

        const acc = this.baseAcceleration * this.speed;
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Rotação Visual
        if (Math.hypot(this.velX, this.velY) > 10) {
            const moveAngle = Math.atan2(this.velY, this.velX);
            let diff = moveAngle - this.visualRotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.visualRotation += diff * 0.15;
        }

        // Limpeza de Projéteis (Reaproveitamento de memória)
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.dead) {
                ProjectilePool.release(b);
                this.bullets.splice(i, 1);
            } else {
                b.update(dt);
            }
        }

        if (this.lockOnTimer > 0) {
            this.lockOnTimer -= dt;
            if (this.lockOnTimer <= 0) this.lockedTarget = null;
        }

        // Atualização do Contexto Reutilizável
        this._cachedContext.enemies = gameState.enemies;
        this._cachedContext.hazards = gameState.hazards;
        this._cachedContext.player = this;
        this._cachedContext.dt = dt;

        this.loadout.update(dt, this._cachedContext);

        if (input.fireSwap) {
            this.loadout.swap();
            input.fireSwap = false;
        }

        if (input.fireReleased) {
            let aimDir = { x: input.lastAim.x, y: input.lastAim.y };
            
            if (input.isTap) {
                const target = this.findNearestTarget(this._cachedContext);
                if (target) {
                    const dir = MathUtils.getDir(this.x, this.y, target.x, target.y);
                    aimDir = { x: dir.x, y: dir.y };
                    this.lockedTarget = target;
                    this.lockOnTimer = 1.0;
                    input.lastAim = { ...aimDir };
                }
            }

            const activeWeapon = this.loadout.getActiveWeapon();
            if (activeWeapon) {
                const fired = activeWeapon.executeFire(this._cachedContext, aimDir);
                if (fired) {
                    this.visualRotation = Math.atan2(aimDir.y, aimDir.x);
                    if (this.onShootEffect) this.onShootEffect(this);
                }
            }
            input.fireReleased = false;
        }
    }

    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }

    takeDamage(amount) {
        applyDamage(this, amount);
    }

    addXp(amount) {
        gainXp(this, amount);
    }

    giveUpgrade(upgradeId) {
        return applyUpgrade(this, upgradeId);
    }
}

