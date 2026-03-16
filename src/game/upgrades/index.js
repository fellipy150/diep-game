
// 1. Carregamento automático dos arquivos na pasta /types
const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];

/**
 * Objeto Central de Upgrades
 * Une as funcionalidades de Loader, Manager e Registry
 */
export const UpgradeRegistry = {
    
    // --- Lógica do Loader ---
    
    async init() {
        registry.length = 0;
        for (const path in modules) {
            const module = modules[path];
            // Suporta export default ou export const
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

    // --- Lógica de Consulta (Registry) ---

    getAll: () => registry,

    getById: (id) => {
        return registry.find(u => u.id === id);
    },

    // Retorna todos os IDs de upgrades que o player já coletou
    getPlayerTags: (player) => {
        const tags = [];
        const activeIds = Object.keys(player.upgradeCounts || {});
        
        activeIds.forEach(id => {
            const up = UpgradeRegistry.getById(id);
            if (up && up.tags) tags.push(...up.tags);
        });
        return tags;
    },

    // --- Lógica de Gerenciamento (Manager) ---

    getRandomChoices: (count = 4) => {
        const available = UpgradeRegistry.getAll();
        
        console.log("🕵️ [DEBUG] Buscando upgrades disponíveis...");
        
        if (!available || available.length === 0) {
            console.warn("⚠️ Manager não achou upgrades! Retornando lista vazia.");
            return [];
        }

        const choices = [...available]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

        console.log("🕵️ [DEBUG] Upgrades sorteados:", choices);
        return choices;
    },

    /**
     * Aplicação direta do efeito do upgrade
     */
    apply: (player, upgradeId) => {
        const upgrade = UpgradeRegistry.getById(upgradeId);
        
        if (upgrade && typeof upgrade.apply === 'function') {
            upgrade.apply(player);
            console.log(`💪 Aplicado: ${upgrade.name}`);
            return true;
        } else {
            console.error(`❌ Falha ao aplicar upgrade: ${upgradeId}`);
            return false;
        }
    }
};

// Alias para manter compatibilidade com códigos que usam initUpgrades separadamente
export const initUpgrades = UpgradeRegistry.init;
export const getAllUpgrades = UpgradeRegistry.getAll;
