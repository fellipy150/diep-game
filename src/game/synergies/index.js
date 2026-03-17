import { showSynergyToast } from '../ui/SynergyToast.js';

const synergyRegistry = [
    {
        id: 'berserker_mode',
        name: 'Modo Berserker',
        description: 'Dano dobrado, mas você perde 5% da vida atual ao atirar.',
        requiredTags: { offensive: 2, fire_rate: 1 },
        apply: (player) => {
            // 🔴 CORREÇÃO BUG 4: Parâmetros separados (stat, id, value, type)
            player.stats.addModifier('damage', 'berserker_mode', 2.0, 'multiply');
            
            player.onShootEffect = (p) => { p.hp -= p.hp * 0.05; };
        }
    }
];

export const SynergyEngine = {
    // 🔴 CORREÇÃO BUG 3: Removido o 'async'. Recebemos o UpgradeRegistry por injeção!
    evaluate: (player, UpgradeRegistry) => {
        player.activeSynergies = player.activeSynergies || new Set();
        const playerTags = {};

        Object.entries(player.upgradeCounts).forEach(([id, count]) => {
            // Usamos a dependência injetada!
            const up = UpgradeRegistry.getById(id);
            if (up?.tags) {
                up.tags.forEach(tag => {
                    playerTags[tag] = (playerTags[tag] || 0) + count;
                });
            }
        });

        // Verifica quais sinergias podem ser ativadas
        synergyRegistry.forEach(syn => {
            if (player.activeSynergies.has(syn.id)) return;
            
            // Checa se todos os requisitos de tags foram batidos
            const met = Object.entries(syn.requiredTags).every(([tag, threshold]) => {
                return (playerTags[tag] || 0) >= threshold;
            });
            
            if (met) {
                player.activeSynergies.add(syn.id);
                syn.apply(player);
                showSynergyToast(syn); // Feedback visual
            }
        });
    }
};

export function getSynergyHint(_player, _upgrade) { 
    return null; 
}
