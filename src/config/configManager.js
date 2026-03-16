import { bulletConfigs } from '../entities/projectiles/configs/index.js';
export const gameData = {
    bullets: bulletConfigs,
    enemies: {},
  //  upgrades: { statUpgrades: [] },
    synergies: { synergies: [] }
};
export async function loadAllConfigs() {
    console.log("📦 Configurações estáticas carregadas!");
    return Promise.resolve(gameData);
}
