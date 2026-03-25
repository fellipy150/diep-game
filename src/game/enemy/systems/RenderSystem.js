const SHAPES = {
  circle: (ctx, r) => {
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
  },
  triangle: (ctx, r) => {
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.lineTo(r, r)
    ctx.lineTo(-r, r)
    ctx.closePath()
    ctx.fill()
  },
  diamond: (ctx, r) => {
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.lineTo(r, 0)
    ctx.lineTo(0, r)
    ctx.lineTo(-r, 0)
    ctx.closePath()
    ctx.fill()
  },
  hexagon: (ctx, r) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  },
}
export const RenderEnemy = (ctx, camera, enemy) => {
  const drawX = enemy.x - camera.x
  const drawY = enemy.y - camera.y
  ctx.save()
  ctx.translate(drawX, drawY)
  const stats = enemy.type.stats
  ctx.fillStyle = stats.color || '#ff00ff'
  const shapeKey = stats.shape || 'circle'
  const drawShape = SHAPES[shapeKey] || SHAPES.circle
  drawShape(ctx, enemy.radius)
  ctx.restore()
  if (enemy.shootTarget) {
    const angle = Math.atan2(
      enemy.shootTarget.y - enemy.y,
      enemy.shootTarget.x - enemy.x
    )
    ctx.save()
    ctx.translate(drawX, drawY)
    ctx.rotate(angle)
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(enemy.radius * 0.5, 0, enemy.radius * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  if (enemy.hp < enemy.maxHp) {
    drawHealthBar(ctx, drawX, drawY, enemy.hp, enemy.maxHp)
  }
}
function drawHealthBar(ctx, x, y, hp, maxHp) {
  const width = 40
  const height = 6
  const barX = x - width / 2
  const barY = y - 45
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(barX, barY, width, height)
  const hpRatio = Math.max(0, hp / maxHp)
  ctx.fillStyle =
    hpRatio > 0.4 ? '#2ecc71' : hpRatio > 0.2 ? '#f1c40f' : '#e74c3c'
  ctx.fillRect(barX, barY, width * hpRatio, height)
}
