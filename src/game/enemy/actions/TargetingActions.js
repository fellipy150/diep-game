export const TargetingActions = {
  getClosestTarget: (self, player, enemies, radius = Infinity) => {
    let closest = null
    let minDistSq = radius * radius
    if (player && !player.dead) {
      const dx = player.x - self.x
      const dy = player.y - self.y
      const distSq = dx * dx + dy * dy
      if (distSq < minDistSq) {
        minDistSq = distSq
        closest = player
      }
    }
    for (const other of enemies) {
      if (other === self || other.dead) continue
      const dx = other.x - self.x
      const dy = other.y - self.y
      const distSq = dx * dx + dy * dy
      if (distSq < minDistSq) {
        minDistSq = distSq
        closest = other
      }
    }
    return closest
  },
}
