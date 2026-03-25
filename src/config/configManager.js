export const gameData = {
  bullets: {},
  enemies: {},
  synergies: { synergies: [] },
}
export async function loadAllConfigs() {
  console.log('📦 Configurações estáticas carregadas!')
  return Promise.resolve(gameData)
}
