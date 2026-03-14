// src/game/upgrades/upgradeManager.js
import { getAllUpgrades } from './upgradeLoader.js';

export const UpgradeManager = {
    /**
     * Sorteia N upgrades para o menu de Level Up
     */
    getRandomChoices: (count = 4) => {
        const available = getAllUpgrades();
        
        // Se não houver nada carregado, retorna lista vazia para não crashar
        if (available.length === 0) return [];

        // Embaralha e pega os primeiros N
        return [...available]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
    },

    /**
     * Executa a lógica de aplicação do upgrade selecionado
     */
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
