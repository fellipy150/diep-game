import { showSynergyToast } from '../ui/SynergyToast.js';
// A importação do UpgradeSystem foi removida do topo para evitar o ciclo de dependências.

// 1. Registro de Sinergias (Contrato Declarativo)
const synergyRegistry = [
    {
        id: 'berserker_mode',
        name: 'Modo Berserker',
        description: 'Dano dobrado, mas você perde 5% da vida atual ao atirar.',
        requiredTags: { offensive: 2, fire_rate: 1 },
        apply: (player) => {
            player.stats.addModifier({ 
                stat: 'damage', type: 'multiply', value: 2.0, source: 'berserker_mode' 
            });
            // Efeito colateral: injetamos uma nova lógica no combate do player
            player.onShootEffect = (p) => { p.hp -= p.hp * 0.05; };
        }
    }
];

export const SynergyEngine = {
    // Transformado em async para permitir a importação dinâmica interna
    evaluate: async (player) => {
        // Importação dinâmica feita dentro da função para quebrar o ciclo!
        const { UpgradeSystem } = await import('../upgrades/index.js');
        
        player.activeSynergies = player.activeSynergies || new Set();
        
        // Contabiliza as tags que o player possui atualmente
        const playerTags = {};
        Object.entries(player.upgradeCounts).forEach(([id, count]) => {
            const up = UpgradeSystem.getById(id);
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

// 🛑 Correção do Linter: Adicionado '_' antes de player e upgrade
// Export temporário para o Level Up Menu não quebrar
export function getSynergyHint(_player, _upgrade) {
    return null; // Retornaremos a lógica real quando tivermos as sinergias prontas
}
