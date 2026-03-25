import { gameState, limparListaInPlace, fastRemove } from './state.js'
import { processarColisoes } from './physics.js'
import { desenharGameOver } from './ui/index.js'
import { EnemySpawner } from './enemySpawner.js'
import { Player, handleProgress } from './player/index.js'
import { resetCamera, updateCamera, renderGame } from './renderer.js'
import PerfMonitor from '../core/PerfMonitor.js'
import { DOMManager } from './ui/DOMManager.js'
// 🔴 Gerenciador HTML/CSS
let lastTime = 0
export function startGameLoop() {
  gameState.player = new Player(1000, 1000)
  resetCamera(gameState.player)
  DOMManager.init(gameState.player)
  DOMManager.updateHotbar(gameState.player.inventory)
  gameState.player.onLevelUp = () => {
    gameState.pendingLevelUp = true
  }
  requestAnimationFrame(loop)
}
function loop(time) {
  PerfMonitor.frameStart(time)
  if (lastTime === 0) {
    lastTime = time
    requestAnimationFrame(loop)
    return
  }
  const dt = Math.min((time - lastTime) / 1000, 0.1)
  lastTime = time
  const { player, isPaused, isGameOver, ctx, canvas } = gameState
  if (!isPaused && !isGameOver && player) {
    PerfMonitor.markStart('update:total')
    update(dt)
    PerfMonitor.markEnd('update:total')
  }
  if (player && ctx && canvas) {
    // 🔴 AJUSTE: Removemos width/height da assinatura
    updateCamera(player)
    PerfMonitor.markStart('render:total')
    renderGame(ctx, canvas, gameState)
    PerfMonitor.markEnd('render:total')
  }
  PerfMonitor.frameEnd()
  requestAnimationFrame(loop)
}
function update(dt) {
  const { player, enemies, hazards, damageNumbers } = gameState
  PerfMonitor.markStart('update:player')
  player.update(dt, gameState)
  PerfMonitor.markEnd('update:player')
  EnemySpawner.update(dt, gameState)
  PerfMonitor.markStart('update:enemies')
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (e.dead) {
      const participacao = Math.min(1, e.playerDamageDealt / e.maxHp)
      const xpFinal = Math.floor(e.baseXp * participacao)
      if (xpFinal > 0) {
        player.addXp(xpFinal)
      }
      fastRemove(enemies, i)
    } else {
      e.update(dt, player, enemies, hazards)
    }
  }
  PerfMonitor.markEnd('update:enemies')
  PerfMonitor.markStart('collision')
  processarColisoes()
  PerfMonitor.markEnd('collision')
  limparListaInPlace(player.bullets)
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    if (e.bullets) limparListaInPlace(e.bullets)
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const n = damageNumbers[i]
    n.y -= 40 * dt
    n.life -= dt
    if (n.life <= 0) fastRemove(damageNumbers, i)
  }
  if (player.hp <= 0 && !gameState.isGameOver) {
    gameState.isGameOver = true
    DOMManager.showGameOver(player.level)
  }
  DOMManager.updateHUD(player)
  DOMManager.updateAmmoUI(player.inventory)
  if (gameState.pendingLevelUp) {
    gameState.isPaused = true
    handleProgress(player, gameState)
    gameState.pendingLevelUp = false
  }
}
