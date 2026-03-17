const STRATEGIES = {
    balanced: { maxHp: 25, damage: 25, speed: 25, fireRate: 25 },
    tank:     { maxHp: 60, damage: 20, speed: 10, fireRate: 10 },
    assassin: { maxHp: 10, damage: 40, speed: 30, fireRate: 20 },
    sniper:   { maxHp: 10, damage: 30, speed: 10, fireRate: 50 }
};
const BUFF_VALUES = {
    maxHp: { type: 'add', value: 20 },
    damage: { type: 'add', value: 5 },
    speed: { type: 'multiply', value: 1.05 },
    fireRate: { type: 'multiply', value: 0.95 }
};
export const UpgradeSystem = {
    evolve: (enemy, level) => {
        if (level <= 1) return;
        const strategyName = enemy.type?.stats?.upgradeStrategy || 'balanced';
        const weights = STRATEGIES[strategyName] || STRATEGIES.balanced;
        for (let i = 1; i < level; i++) {
            const statToUpgrade = chooseWeightedStat(weights);
            applyStatChange(enemy, statToUpgrade);
        }
        enemy.hp = enemy.stats.get('maxHp');
    }
};
function chooseWeightedStat(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (const [stat, weight] of Object.entries(weights)) {
        if (random < weight) return stat;
        random -= weight;
    }
    return 'maxHp';
}
function applyStatChange(enemy, stat) {
    const config = BUFF_VALUES[stat];
    if (!config || !enemy.stats) return;
    enemy.stats.addModifier(
        stat,
        `evo_${stat}_${Math.random().toString(36).substr(2, 5)}`,
        config.value,
        config.type
    );
}
