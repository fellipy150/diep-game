// Removemos o import fantasma do bulletConfigs!

export const gameData = {
    bullets: {}, // Vazio por enquanto, aguardando o Projéteis 2.0
    enemies: {},
    synergies: { synergies: [] } // Podemos limpar isso também no futuro se o SynergyEngine assumir 100%
};

export async function loadAllConfigs() {
    console.log("📦 Configurações estáticas carregadas!");
    return Promise.resolve(gameData);
}
