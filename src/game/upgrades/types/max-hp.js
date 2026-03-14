export const maxHpUpgrade = {
    id: 'max_hp',
    name: 'Blindagem Reforçada',
    description: 'Aumenta o HP máximo em 50 e recupera toda a vida instantaneamente.',
    type: 'stat',
    apply: (player) => {
        player.maxHp += 50;
        player.hp = player.maxHp;
        console.log("❤️ Vida expandida e recuperada!");
    }
};
