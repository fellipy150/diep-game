import { showSynergyToast } from '../ui/SynergyToast.js';
const synergyRegistry = [
    {
        id: 'berserker_mode',
        name: 'Modo Berserker',
        description: 'Dano dobrado, mas você perde 5% da vida atual ao atirar.',
        requiredTags: { offensive: 2, fire_rate: 1 },
        apply: (player) => {
            player.stats.addModifier('damage', 'berserker_mode', 2.0, 'multiply');
            player.onShootEffect = (p) => { p.hp -= p.hp * 0.05; };
        }
    }
];
export const SynergyEngine = {
    evaluate: (player, UpgradeRegistry) => {
        player.activeSynergies = player.activeSynergies || new Set();
        const playerTags = {};
        Object.entries(player.upgradeCounts).forEach(([id, count]) => {
            const up = UpgradeRegistry.getById(id);
            if (up?.tags) {
                up.tags.forEach(tag => {
                    playerTags[tag] = (playerTags[tag] || 0) + count;
                });
            }
        });
        synergyRegistry.forEach(syn => {
            if (player.activeSynergies.has(syn.id)) return;
            const met = Object.entries(syn.requiredTags).every(([tag, threshold]) => {
                return (playerTags[tag] || 0) >= threshold;
            });
            if (met) {
                player.activeSynergies.add(syn.id);
                syn.apply(player);
                showSynergyToast(syn);
            }
        });
    }
};
export function getSynergyHint(_player, _upgrade) {
    return null;
}
