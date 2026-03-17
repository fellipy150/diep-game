// 1. Carregamento automático dos arquivos na pasta /types
const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];

// Pesos para o sorteio ponderado (Gacha-like)
const RARITY_WEIGHTS = { 
    common: 50, 
    uncommon: 30, 
    rare: 15, 
    epic: 4, 
    legendary: 1 
};

/**
 * Objeto Central de Upgrades
 * Gerencia a carga, sorteio ponderado e aplicação via StatSheet
 */
export const UpgradeRegistry = {
    
    // --- Lógica do Loader ---
    
    async init() {
        registry.length = 0;
        for (const path in modules) {
            const module = modules[path];
            const data = module.default || Object.values(module)[0];
            
            if (data && data.id) {
                registry.push(data);
                console.log(`✨ Upgrade registrado: [${data.id}] (${data.rarity || 'common'})`);
            }
        }

        if (registry.length === 0) {
            console.error("⚠️ Nenhum upgrade foi encontrado na pasta types/!");
        } else {
            console.log(`✅ Sistema de Progressão pronto: ${registry.length} itens.`);
        }
    },

    // --- Lógica de Consulta ---

    getAll: () => registry,

    getById: (id) => registry.find(u => u.id === id),

    getPlayerTags: (player) => {
        const tags = [];
        const activeIds = Object.keys(player.upgradeCounts || {});
        
        activeIds.forEach(id => {
            const up = UpgradeRegistry.getById(id);
            if (up && up.tags) tags.push(...up.tags);
        });
        return tags;
    },

    // --- Lógica de Gerenciamento (Sorteio Ponderado) ---

    getChoices: (player, count = 4) => {
        // 1. Filtra apenas os upgrades que ainda não estouraram o limite de stacks
        const eligible = registry.filter(up => {
            const stacks = player.upgradeCounts[up.id] || 0;
            return !up.maxStacks || stacks < up.maxStacks;
        });

        const choices = [];
        const pool = [...eligible];

        // 2. Sorteio ponderado baseado nos pesos de raridade
        for (let i = 0; i < count && pool.length > 0; i++) {
            const totalWeight = pool.reduce((sum, up) => sum + (RARITY_WEIGHTS[up.rarity] || 0), 0);
            
            if (totalWeight <= 0) break; // Evita loop infinito se pesos estiverem errados

            let random = Math.random() * totalWeight;
            
            const index = pool.findIndex(up => {
                random -= (RARITY_WEIGHTS[up.rarity] || 0);
                return random <= 0;
            });

            if (index !== -1) {
                // Remove do pool temporário para não repetir na mesma escolha
                choices.push(pool.splice(index, 1)[0]);
            }
        }
        
        console.log(`🎲 Upgrades sorteados para Nível ${player.level}:`, choices.map(c => `${c.id} [${c.rarity}]`));
        return choices;
    },

    /**
     * Aplicação via Modificadores (StatSheet) com Reavaliação de Sinergia
     */
    apply: (player, id) => {
        const up = UpgradeRegistry.getById(id);
        
        if (!up) {
            console.error(`❌ Upgrade não encontrado no registro: ${id}`);
            return false;
        }

        // 1. Injeta o modificador no StatSheet (Se houver)
        if (up.modifier) {
            if (player.stats && typeof player.stats.addModifier === 'function') {
                player.stats.addModifier({
                    ...up.modifier,
                    source: id
                });
            }
        }

        // 2. Registra a contagem de upgrade
        player.upgradeCounts = player.upgradeCounts || {};
        player.upgradeCounts[id] = (player.upgradeCounts[id] || 0) + 1;

        // 3. Executa onUnlock para efeitos instantâneos
        if (typeof up.onUnlock === 'function') {
            up.onUnlock(player);
        }

        // 🚀 4. REAVALIAÇÃO DE SINERGIA
        import('../synergies/index.js').then(m => {
            console.log(`🧬 [SynergyEngine] Reavaliando personagem após upgrade: ${id}`);
            m.SynergyEngine.evaluate(player);
        }).catch(err => {
            console.warn("⚠️ Falha ao carregar o motor de sinergia:", err);
        });

        return true;
    }
};

// Aliases para compatibilidade
export const initUpgrades = UpgradeRegistry.init;
export const getAllUpgrades = UpgradeRegistry.getAll;
export const UpgradeSystem = UpgradeRegistry; // Alias solicitado na instrução
