export const maxHpUpgrade = {
    id: 'max_hp',
    name: 'Blindagem Reforçada',
    description: 'Aumenta o HP máximo em 50 e recupera toda a vida instantaneamente.',
    rarity: 'common',
    tags: ['hp', 'survival'],
    maxStacks: 5,
    weight: 10,

    modifier: { 
        stat: 'maxHp', 
        value: 50, 
        type: 'add' 
    },

    // 🔴 MUDANÇA AQUI: De 'apply' para 'onUnlock'
    onUnlock: (player) => {
        // Como o UpgradeRegistry aplica o modifier ANTES, 
        // o player.maxHp já estará com o valor novo.
        player.hp = player.maxHp; 
        console.log("❤️ Vida máxima expandida e HP totalmente recuperado!");
    }
};
