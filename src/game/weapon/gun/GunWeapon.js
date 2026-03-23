import { ProjectilePool } from "../../projectiles/ProjectilePool.js";
import { LobbedProjectile } from "../../projectiles/index.js";
import { WeaponBase } from "../base/WeaponBase.js";
import { gameData } from "../../../config/configManager.js";
import { SynergyRegistry } from "../../synergies/SynergyRegistry.js";

/**
 * GunWeapon: Classe base para armas que disparam projéteis baseados em carregador (munição).
 */
export class GunWeapon extends WeaponBase {
    constructor(config) {
        // Inicializa a base (id e nome)
        super(config.id || 'basic_gun', config.name || 'Pistola');
        
        // 🔴 MUDANÇA: 'magSize' representa a capacidade do carregador da arma
        this.magSize = config.magSize || 8; 
        this.currentAmmo = this.magSize;
        
        // Atributos de cadência e recarga
        this.reloadTime = config.reloadTime || 0.8;
        this.reloadTimer = 0;
        this.burstDelay = config.burstDelay || 0.1;
        this.burstTimer = 0;
        
        // Atributos visuais e de tipo
        this.bulletColor = config.bulletColor || '#00ffff';
        this.bulletType = config.bulletType || 'normal';
        
        // ⚖️ Atributos para o Sistema de Inventário
        this.weight = config.weight || 1;
        this.icon = config.icon || '🔫';
    }

    /**
     * Atualiza os timers internos da arma (Recarga e Cooldown entre tiros).
     */
    update(dt, _context) {
        // Lógica de recarregamento automático (regenera munição ao longo do tempo)
        if (this.currentAmmo < this.magSize) {
            this.reloadTimer += dt;
            if (this.reloadTimer >= this.reloadTime) {
                this.currentAmmo++;
                this.reloadTimer = 0;
            }
        }

        // Cooldown entre rajadas
        if (this.burstTimer > 0) {
            this.burstTimer -= dt;
        }
    }

    /**
     * Executa o disparo baseado na direção da mira.
     */
    executeFire(context, aimDir) {
        // Validação de disparo (Munição e Cooldown)
        if (this.currentAmmo <= 0 || this.burstTimer > 0) return false;

        const p = this.owner;
        if (!p) return false;

        // 1. Cálculo de Atributos Base (Stats do Player ou do Tipo do Inimigo)
        const damage = p.stats ? p.stats.get('damage') : (p.type?.stats?.damage || 10);
        const bulletSpeed = p.stats ? p.stats.get('bulletSpeed') : (p.type?.stats?.bulletSpeed || 300);
        const multishot = p.stats ? (p.stats.get('multiShot') || 1) : 1;
        const isPlayer = !!p.stats;

        // Configurações específicas do tipo de bala
        const config = (gameData.bullets && gameData.bullets[this.bulletType])
                       || { multishotScale: 1, type: 'normal' };

        // 2. Lógica de Multishot / Spread (Leque de tiros)
        const baseAngle = Math.atan2(aimDir.y, aimDir.x);
        const shotCount = config.multishotScale === 0 ? 1 : Math.max(1, Math.round(multishot * (config.multishotScale || 1)));
        const spread = (15 * Math.PI / 180); // 15 graus de abertura
        const startAngle = baseAngle - (spread * (shotCount - 1)) / 2;

        for (let i = 0; i < shotCount; i++) {
            const ang = startAngle + (i * spread);
            const vx = Math.cos(ang);
            const vy = Math.sin(ang);

            // Configuração básica do projétil
            const bulletConfig = {
                x: p.x,
                y: p.y,
                vx: vx,
                vy: vy,
                speed: bulletSpeed,
                damage: damage,
                source: isPlayer ? 'player' : 'enemy',
                color: this.bulletColor,
                type: this.bulletType,
                effects: p.activeBulletEffects ? [...p.activeBulletEffects] : [],
                pierceCount: 0,
                bounces: 0
            };

            // 3. Aplicação de Sinergias (Apenas para o Player)
            if (isPlayer && p.activeSynergies) {
                p.activeSynergies.forEach(synId => {
                    const syn = SynergyRegistry.find(s => s.id === synId);
                    if (!syn) return;
                    
                    const conditionMet = !syn.condition || (p.synergyConditionsMet && p.synergyConditionsMet[synId]);
                    if (conditionMet && syn.effect && syn.effect.applyToBullet) {
                        syn.effect.applyToBullet(bulletConfig, p);
                    }
                });
            }

            // 4. Criação e Injeção do Projétil no Mundo
            let projectile;
            if (config.type === 'lobbed') {
                // Projéteis parabólicos (Ex: Granadas)
                projectile = new LobbedProjectile(
                    bulletConfig.x, bulletConfig.y,
                    bulletConfig.x + bulletConfig.vx * 400, bulletConfig.y + bulletConfig.vy * 400,
                    bulletConfig.type,
                    bulletConfig.damage
                );
            } else {
                // Projéteis lineares (Usando Pool para performance)
                projectile = ProjectilePool.get(bulletConfig);
            }

            // Injeta o projétil via callback do contexto (Player ou Inimigo)
            if (context.addProjectile) {
                context.addProjectile(projectile);
            } else if (context.bullets) {
                context.bullets.push(projectile);
            }
        }

        // 5. Gasto de recursos e reseto de cooldown
        this.currentAmmo--; 
        this.burstTimer = this.burstDelay;
        return true;
    }
}

