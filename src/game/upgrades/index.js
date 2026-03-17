// 1. Carregamento automático dos arquivos na pasta /types
const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];
const RARITY_WEIGHTS = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
};
export const UpgradeRegistry = {
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
    getChoices: (player, count = 4) => {
        const eligible = registry.filter(up => {
            const stacks = player.upgradeCounts[up.id] || 0;
            return !up.maxStacks || stacks < up.maxStacks;
        });
        const choices = [];
        const pool = [...eligible];
        for (let i = 0; i < count && pool.length > 0; i++) {
            const totalWeight = pool.reduce((sum, up) => sum + (RARITY_WEIGHTS[up.rarity] || 0), 0);
            if (totalWeight <= 0) break;
            let random = Math.random() * totalWeight;
            const index = pool.findIndex(up => {
                random -= (RARITY_WEIGHTS[up.rarity] || 0);
                return random <= 0;
            });
            if (index !== -1) {
                choices.push(pool.splice(index, 1)[0]);
            }
        }
        console.log(`🎲 Upgrades sorteados para Nível ${player.level}:`, choices.map(c => `${c.id} [${c.rarity}]`));
        return choices;
    },
    apply: (player, id) => {
        const up = UpgradeRegistry.getById(id);
        if (!up) {
            console.error(`❌ Upgrade não encontrado no registro: ${id}`);
            return false;
        }
        player.upgradeCounts = player.upgradeCounts || {};
        player.upgradeCounts[id] = (player.upgradeCounts[id] || 0) + 1;
        const currentStack = player.upgradeCounts[id];
        if (up.modifier && player.stats && typeof player.stats.addModifier === 'function') {
            const uniqueModId = `${id}_stack_${currentStack}`;
            player.stats.addModifier(
                up.modifier.stat,
                uniqueModId,
                up.modifier.value,
                up.modifier.type
            );
        }
        if (typeof up.onUnlock === 'function') {
            up.onUnlock(player);
        }
        return true;
    }
};
export const UpgradeSystem = UpgradeRegistry;
