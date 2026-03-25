export const capacityUpgrade = {
  id: 'capacity_up',
  name: 'Mochila Tática',
  description:
    '+1 de Espaço no Inventário. Permite carregar mais armas simultaneamente.',
  icon: '🎒', // Use emoji provisório até ter o SVG/PNG
  maxLevel: 3,
  tier: 'rare',
  onApply: player => {
    if (player.inventory) {
      player.inventory.capacity += 1
      console.log(`Capacidade aumentada para: ${player.inventory.capacity}`)
    }
  },
}
