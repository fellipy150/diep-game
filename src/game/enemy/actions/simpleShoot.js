export const simpleShoot = (enemy, context) => {
  if (!enemy.shootTarget || !enemy.weapon) return
  const dx = enemy.shootTarget.x - enemy.x
  const dy = enemy.shootTarget.y - enemy.y
  const dist = Math.hypot(dx, dy) || 1
  const aimDir = { x: dx / dist, y: dy / dist }
  enemy.weapon.executeFire(context, aimDir)
}
