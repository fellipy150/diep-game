export const wandering = (enemy, dt) => {
  enemy.randomMoveTimer = (enemy.randomMoveTimer || 0) - dt
  if (enemy.randomMoveTimer <= 0) {
    const angle = Math.random() * Math.PI * 2
    enemy.randomMoveDir = { x: Math.cos(angle), y: Math.sin(angle) }
    enemy.randomMoveTimer = 1 + Math.random() * 2
  }
  return enemy.randomMoveDir || { x: 0, y: 0 }
}
