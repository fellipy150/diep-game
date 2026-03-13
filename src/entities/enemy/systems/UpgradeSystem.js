export const UpgradeSystem = {
    evolve: (enemy, level) => {
        const strategy = enemy.type.upgradeStrategy;
        
        for (let i = 0; i < level; i++) {
            let statToUpgrade;

            if (strategy) {
                // Lógica dinâmica: escolhe baseado nas prioridades do inimigo
                statToUpgrade = chooseWeightedStat(strategy);
            } else {
                // Fallback: Aleatório total
                statToUpgrade = getRandomStat();
            }
            
            applyStatChange(enemy, statToUpgrade);
        }
    }
};
