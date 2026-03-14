export const fireRateUpgrade = {
    id: 'fire_rate',
    name: 'Mecanismo de Repetição',
    description: 'Reduz o intervalo entre disparos em 15%, permitindo atirar mais rápido.',
    type: 'stat',
    apply: (player) => {
        player.fireRate *= 0.85;
        console.log("🔫 Cadência de tiro aumentada!");
    }
};
