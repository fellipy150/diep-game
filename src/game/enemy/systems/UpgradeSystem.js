export const UpgradeSystem = {
    evolve: (enemy, level) => {
        const strategy = enemy.type.upgradeStrategy;
        for (let i = 0; i < level; i++) {
            let statToUpgrade;
            if (strategy) {
                statToUpgrade = chooseWeightedStat(strategy);
            } else {
                statToUpgrade = getRandomStat();
            }
            applyStatChange(enemy, statToUpgrade);
        }
    }
};
