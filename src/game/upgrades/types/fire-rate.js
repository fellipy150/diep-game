export const fireRateUpgrade = {
  id: 'fire_rate',
  name: 'Cadência de Fogo',
  description: 'Reduz o intervalo entre tiros em 15%.',
  rarity: 'common',
  tags: ['fire_rate', 'offensive'],
  maxStacks: 4,
  weight: 10,
  modifier: {
    stat: 'fireRate',
    value: 0.85,
    type: 'multiply',
  },
  apply: _player => {
    console.log('🔥 Cadência otimizada!')
  },
}
