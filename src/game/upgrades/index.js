// 1. Carregamento automático dos arquivos na pasta /types
const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];

/**
 * Objeto Central de Upgrades
 * Gerencia a carga, sorteio e aplicação de melhorias via StatSheet e Sinergias
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
                console.log(`✨ Upgrade registrado: [${data.id}]`);
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

    // --- Lógica de Gerenciamento ---

    getRandomChoices: (count = 4) => {
        const available = UpgradeRegistry.getAll();
        
        if (!available || available.length === 0) {
            console.warn("⚠️ Manager não achou upgrades! Retornando lista vazia.");
            return [];
        }

        return [...available]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
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
        // Import dinâmico para evitar dependência circular e garantir o check imediato
        import('../synergy/index.js').then(m => {
            console.log(`🧬 [SynergyEngine] Reavaliando personagem após upgrade: ${id}`);
            m.SynergyEngine.evaluate(player);
        }).catch(err => {
            console.warn("⚠️ Falha ao carregar o motor de sinergia:", err);
        });

        console.log(`✅ Upgrade [${up.name}] aplicado com sucesso.`);
        return true;
    }
};

export const initUpgrades = UpgradeRegistry.init;
export const getAllUpgrades = UpgradeRegistry.getAll;
