import { SynergyRegistry } from './SynergyRegistry.js'
import { camera } from '../renderer.js'
import { showSynergyToast } from '../ui/SynergyToast.js'

export const SynergyEngine = {
  evaluate(player) {
    if (!player || !player.weapon) return
    const currentBullet = player.weapon.bulletType || player.currentBulletType
    for (const syn of SynergyRegistry) {
      const hasRightBullet =
        syn.requiredBulletId === '*' || syn.requiredBulletId === currentBullet
      const upgradeCount = player.upgradeCounts[syn.requiredPowerupId] || 0
      const meetsUpgrades = upgradeCount >= syn.requiredCount
      if (hasRightBullet && meetsUpgrades) {
        if (!player.activeSynergies.has(syn.id)) {
          this.addSynergy(player, syn)
        }
      } else {
        this.removeSynergy(player, syn.id)
      }
    }
  },
  update(player, dt, context) {
    if (!player.activeSynergies || player.activeSynergies.size === 0) return
    player.activeSynergies.forEach(synId => {
      const syn = SynergyRegistry.find(s => s.id === synId)
      if (!syn) return
      if (syn.duration !== null) {
        player.synergyTimers = player.synergyTimers || {}
        if (player.synergyTimers[synId] === undefined) {
          player.synergyTimers[synId] = syn.duration
        }
        player.synergyTimers[synId] -= dt
        if (player.synergyTimers[synId] <= 0) {
          this.removeSynergy(player, synId)
          delete player.synergyTimers[synId]
          return
        }
      }
      if (syn.condition) {
        const conditionMet = syn.condition(context, player)
        player.synergyConditionsMet = player.synergyConditionsMet || {}
        player.synergyConditionsMet[synId] = conditionMet
      }
    })
  },
  addSynergy(player, syn) {
    player.activeSynergies.add(syn.id)
    console.log(`✨ Sinergia Ativada: ${syn.name} (${syn.id})`)
    showSynergyToast(syn)
    if (typeof camera !== 'undefined' && camera.shake !== undefined) {
      camera.shake = Math.max(camera.shake, 8)
    }
  },
  removeSynergy(player, synId) {
    if (player.activeSynergies.has(synId)) {
      player.activeSynergies.delete(synId)
      if (player.synergyConditionsMet) delete player.synergyConditionsMet[synId]
      if (player.synergyTimers) delete player.synergyTimers[synId]
      console.log(`❌ Sinergia Desativada: ${synId}`)
    }
  },
}
