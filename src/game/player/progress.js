import { UpgradeSystem } from '../upgrades/index.js'
import { DOMManager } from '../ui/DOMManager.js'
import { SynergyEngine } from '../synergies/SynergyEngine.js'

export function gainXp(player, amount) {
  player.xp += amount
  if (player.xp >= player.xpNeeded) {
    player.level++
    player.xp -= player.xpNeeded
    player.xpNeeded = Math.floor(player.xpNeeded * 1.2)
    console.log(`🎉 Level Up! Nível ${player.level}`)
    if (player.onLevelUp) player.onLevelUp()
  }
}
export function handleProgress(player, gameState) {
  gameState.isPaused = true
  const choices = UpgradeSystem.getChoices(player, 3)
  DOMManager.showLevelUpModal(player, choices, selectedId => {
    applyUpgrade(player, selectedId)
    gameState.isPaused = false
  })
}
export function applyUpgrade(player, upgradeId) {
  UpgradeSystem.apply(player, upgradeId)
  console.log(`💪 Upgrade aplicado: ${upgradeId}`)
  if (SynergyEngine && typeof SynergyEngine.evaluate === 'function') {
    SynergyEngine.evaluate(player, UpgradeSystem)
  }
  if (window.DOMManager) {
    window.DOMManager.updateHUD(player)
    window.DOMManager.updateHotbar(player.inventory)
  }
  return true
}
