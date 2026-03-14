import { getAllUpgrades } from './upgradeLoader.js';
export const UpgradeManager = {
    getRandomChoices: (count = 4) => {
        const available = getAllUpgrades();
        console.log("🕵️ [DEBUG 1] Upgrades disponíveis no Manager:", available);
        if (!available || available.length === 0) {
            console.warn("⚠️ [DEBUG 1.1] Manager não achou upgrades! Retornando lista vazia.");
            return [];
        }
        const choices = [...available]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
        console.log("🕵️ [DEBUG 2] Upgrades sorteados:", choices);
        return choices;
    },
    apply: (player, upgradeId) => {
        const upgrade = getAllUpgrades().find(u => u.id === upgradeId);
        if (upgrade && typeof upgrade.apply === 'function') {
            upgrade.apply(player);
            console.log(`💪 Aplicado: ${upgrade.name}`);
        } else {
            console.error(`❌ Falha ao aplicar upgrade: ${upgradeId}`);
        }
    }
};
