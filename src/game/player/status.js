import { fastRemove } from "../state.js";

/**
 * Gerencia a expiração de efeitos temporários (Buffs/Debuffs).
 */
export function updateStatusEffects(player, dt) {
    if (!player.activeEffects) return;
    
    // Loop reverso para remoção segura
    for (let i = player.activeEffects.length - 1; i >= 0; i--) {
        const effect = player.activeEffects[i];
        effect.duration -= dt;
        
        if (effect.duration <= 0) {
            // Remove o modificador do StatSheet (isso marcará os status como 'dirty')
            player.stats.removeModifier(effect.stat, effect.id);
            
            // Remove da lista usando Swap and Pop (fastRemove)
            fastRemove(player.activeEffects, i);
            console.log(`✨ Efeito expirado: ${effect.id}`);
        }
    }
}

/**
 * Classe StatSheet: Gerencia atributos com suporte a modificadores e cache de performance.
 */
export class StatSheet {
    constructor(baseStats) {
        this.base = { ...baseStats };
        this.modifiers = [];
        this._cache = {};   
        this._dirty = true; // Flag que indica se os valores precisam ser recalculados
    }

    /**
     * Reconstrói o cache de todos os status. 
     * Chamado apenas quando um modificador é adicionado ou removido.
     */
    _rebuildCache() {
        const cache = {};
        
        for (const stat in this.base) {
            let value = this.base[stat];
            
            // 1. Loop de Adição (Ex: +10 de dano base)
            // Loops tradicionais 'for' são mais rápidos que .filter().forEach()
            for (let i = 0; i < this.modifiers.length; i++) {
                const m = this.modifiers[i];
                if (m.stat === stat && m.type === 'add') {
                    value += m.value;
                }
            }
            
            // 2. Loop de Multiplicação (Ex: x1.2 de velocidade)
            for (let i = 0; i < this.modifiers.length; i++) {
                const m = this.modifiers[i];
                if (m.stat === stat && m.type === 'multiply') {
                    value *= m.value;
                }
            }
            
            cache[stat] = value;
        }
        
        this._cache = cache;
        this._dirty = false;
        console.log("📊 Status recalculados e cache atualizado.");
    }

    /**
     * Retorna o valor final de um atributo de forma instantânea através do cache.
     */
    get(stat) {
        // Se a base mudou ou pegou upgrade, ele recalcula. Se não, retorna instantâneo!
        if (this._dirty) {
            this._rebuildCache();
        }
        return this._cache[stat] ?? (this.base[stat] || 0);
    }

    /**
     * Adiciona um modificador e invalida o cache.
     */
    addModifier(stat, id, value, type = 'multiply') {
        this.removeModifier(stat, id);
        this.modifiers.push({ stat, id, value, type });
        this._dirty = true; // Avisa que os status mudaram e o cache está obsoleto
    }

    /**
     * Remove um modificador e invalida o cache se houver alteração.
     */
    removeModifier(stat, id) {
        const before = this.modifiers.length;
        this.modifiers = this.modifiers.filter(m => !(m.stat === stat && m.id === id));
        
        if (this.modifiers.length !== before) {
            this._dirty = true;
        }
    }

    /**
     * Permite prever como ficará um status com um novo modificador sem aplicá-lo.
     * Útil para menus de Upgrade.
     */
    getPreview(stat, newModifier) {
        const current = this.get(stat);
        
        // Simulação manual (não altera o estado da classe)
        let out = this.base[stat];
        const tempModifiers = [...this.modifiers, { ...newModifier, stat }];
        
        // Soma
        for (const m of tempModifiers) {
            if (m.stat === stat && m.type === 'add') out += m.value;
        }
        // Multiplicação
        for (const m of tempModifiers) {
            if (m.stat === stat && m.type === 'multiply') out *= m.value;
        }

        return {
            before: current,
            after: out,
            diff: out - current
        };
    }
}

