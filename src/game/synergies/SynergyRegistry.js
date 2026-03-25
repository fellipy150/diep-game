const GhostPenetrateEffect = {
  id: 'ghost_penetrate',
  onHit: (bullet, _target, _context) => {
    if (bullet.pierceCount > 0) {
      bullet.pierceCount--
      bullet.damage *= 0.85
      bullet.dead = false
      return true
    }
    return false
  },
}
export const SynergyRegistry = [
  {
    id: 'syn_ghost_bullet',
    name: 'Bala Fantasma',
    description:
      'Sua bala atravessa até 3 inimigos, perdendo dano a cada acerto.',
    requiredBulletId: 'normal',
    requiredPowerupId: 'ghost_pass',
    requiredCount: 3,
    duration: null,
    condition: null,
    effect: {
      type: 'inject_effect',
      applyToBullet: bulletConfig => {
        bulletConfig.pierceCount = (bulletConfig.pierceCount || 0) + 3
        bulletConfig.effects.push(GhostPenetrateEffect)
        bulletConfig.color = 'rgba(255, 255, 255, 0.5)'
      },
    },
  },
]
