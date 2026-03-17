export const fireRateUpgrade = {
    id: 'fire_rate',
    name: 'Cadência de Fogo',
    description: 'Reduz o intervalo entre tiros em 15%.',
    rarity: 'common',
    tags: ['fire_rate', 'offensive'],
    maxStacks: 4,
    weight: 10,
    apply: (player) => {
        player.fireRate *= 0.85;
        player.upgradeCounts = player.upgradeCounts || {};
        player.upgradeCounts['fire_rate'] = (player.upgradeCounts['fire_rate'] || 0) + 1;
    }
};
