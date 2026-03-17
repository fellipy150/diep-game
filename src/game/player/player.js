// 1. Importação dos módulos especialistas e funções de status
import { handleShooting, applyDamage } from "./Combat.js";
import { updateStatusEffects, StatSheet } from './status.js'; // Adicionado StatSheet no import
import { gainXp, applyUpgrade } from "./progress.js";
import { drawPlayer } from "./render.js";
import { input } from "../../core/input.js"; // Assumindo a localização do input

export class Player {
    constructor(x, y) {
        // --- Física e Movimento ---
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.radius = 20;
        this.baseAcceleration = 1400;
        this.friction = 0.88;
        this.visualRotation = 0;

        // --- 📊 SISTEMA DE STATS (Fase 2) ---
        // O Player agora nasce com esses valores base encapsulados.
        this.stats = new StatSheet({
            maxHp: 200,
            speed: 1.0,      // Multiplicador de aceleração
            damage: 40,
            fireRate: 0.6,
            bulletSpeed: 500,
            multiShot: 1
        });

        // --- Status Base ---
        this.hp = this.stats.get('maxHp');
        this.activeEffects = []; // { id, stat, duration }

        // --- Combate ---
        this.currentBulletType = 'normal';
        this.shootTimer = 0;
        this.bullets = [];
        
        // --- RPG e Progressão ---
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.onLevelUp = null;
        this.upgradeCounts = {};
        this.activeSynergies = new Set(); // Alterado para Set() conforme instrução
    }

    // --- 🔍 GETTERS DINÂMICOS ---
    // Permite que o resto do código acesse os status de forma transparente,
    // sempre recebendo o valor atualizado calculado pelo StatSheet.
    get damage() { return this.stats.get('damage'); }
    get fireRate() { return this.stats.get('fireRate'); }
    get speed() { return this.stats.get('speed'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get bulletSpeed() { return this.stats.get('bulletSpeed'); } // Getter extra baseado na inicialização
    get multiShot() { return this.stats.get('multiShot'); }     // Getter extra baseado na inicialização

    // --- Ciclo de Vida Principal ---

    update(dt) {
        // 1. Atualiza timers de buffs/debuffs
        updateStatusEffects(this, dt);

        // 2. Movimentação usando o StatSheet
        let dirX = input.move.x;
        let dirY = input.move.y;
        
        // Normalização do vetor de movimento (evita que andar na diagonal seja mais rápido)
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 1) { 
            dirX /= mag; 
            dirY /= mag; 
        }

        // Agora 'this.speed' aciona o getter e é reativo aos upgrades/efeitos!
        const acc = this.baseAcceleration * this.speed; 
        
        this.velX = (this.velX + dirX * acc * dt) * this.friction;
        this.velY = (this.velY + dirY * acc * dt) * this.friction;
        
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 3. Delegação de Combate
        handleShooting(this, dt);
    }

    draw(ctx, camera) {
        drawPlayer(this, ctx, camera);
    }

    // --- Wrappers (Facilitadores para acesso externo) ---

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
