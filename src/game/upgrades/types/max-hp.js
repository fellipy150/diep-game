/**
 * Upgrade: Blindagem Reforçada
 * Formato atualizado para StatSheet + SynergyEngine
 */
export const maxHpUpgrade = {
    id: 'max_hp',
    name: 'Blindagem Reforçada',
    description: 'Aumenta o HP máximo em 50 e recupera toda a vida instantaneamente.',
    rarity: 'common',
    tags: ['hp', 'survival'],
    maxStacks: 5,
    weight: 10,

    // 🔴 O MODIFICADOR:
    // O UpgradeSystem usará isso para fazer: player.stats.addModifier('maxHp', 'max_hp', 50, 'add')
    modifier: { 
        stat: 'maxHp', 
        value: 50, 
        type: 'add' 
    },

    /**
     * O método apply agora é usado para a cura instantânea.
     * Como o UpgradeSystem aplica o modifier ANTES de chamar esta função,
     * o player.stats.get('maxHp') já retornará o valor com os +50 de bônus.
     */
    apply: (player) => {
        // Recupera a vida para o novo máximo calculado
        player.hp = player.stats.get('maxHp');
        
        console.log("❤️ Vida máxima expandida e HP totalmente recuperado!");
    }
};
