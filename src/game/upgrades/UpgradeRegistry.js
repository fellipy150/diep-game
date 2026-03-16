import { getAllUpgrades } from './upgradeLoader.js';

export const UpgradeRegistry = {
    // Retorna a definição completa de um upgrade pelo ID
    getById: (id) => {
        return getAllUpgrades().find(u => u.id === id);
    },

    // Retorna todos os IDs de upgrades que o player já coletou
    getPlayerTags: (player) => {
        const tags = [];
        const activeIds = Object.keys(player.upgradeCounts || {});
        
        activeIds.forEach(id => {
            const up = UpgradeRegistry.getById(id);
            if (up) tags.push(...up.tags);
        });
        return tags;
    }
};
