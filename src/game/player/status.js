import { fastRemove } from '../state.js'

export function updateStatusEffects(player, dt) {
  if (!player.activeEffects) return
  for (let i = player.activeEffects.length - 1; i >= 0; i--) {
    const effect = player.activeEffects[i]
    effect.duration -= dt
    if (effect.duration <= 0) {
      player.stats.removeModifier(effect.stat, effect.id)
      fastRemove(player.activeEffects, i)
      console.log(`✨ Efeito expirado: ${effect.id}`)
    }
  }
}
export class StatSheet {
  constructor(baseStats) {
    this.base = { ...baseStats }
    this.modifiers = []
    this._cache = {}
    this._dirty = true
  }
  _rebuildCache() {
    const cache = {}
    for (const stat in this.base) {
      let value = this.base[stat]
      for (let i = 0; i < this.modifiers.length; i++) {
        const m = this.modifiers[i]
        if (m.stat === stat && m.type === 'add') {
          value += m.value
        }
      }
      for (let i = 0; i < this.modifiers.length; i++) {
        const m = this.modifiers[i]
        if (m.stat === stat && m.type === 'multiply') {
          value *= m.value
        }
      }
      cache[stat] = value
    }
    this._cache = cache
    this._dirty = false
    console.log('📊 Status recalculados e cache atualizado.')
  }
  get(stat) {
    if (this._dirty) {
      this._rebuildCache()
    }
    return this._cache[stat] ?? (this.base[stat] || 0)
  }
  addModifier(stat, id, value, type = 'multiply') {
    this.removeModifier(stat, id)
    this.modifiers.push({ stat, id, value, type })
    this._dirty = true
  }
  removeModifier(stat, id) {
    const before = this.modifiers.length
    this.modifiers = this.modifiers.filter(
      m => !(m.stat === stat && m.id === id)
    )
    if (this.modifiers.length !== before) {
      this._dirty = true
    }
  }
  getPreview(stat, newModifier) {
    const current = this.get(stat)
    let out = this.base[stat]
    const tempModifiers = [...this.modifiers, { ...newModifier, stat }]
    for (const m of tempModifiers) {
      if (m.stat === stat && m.type === 'add') out += m.value
    }
    for (const m of tempModifiers) {
      if (m.stat === stat && m.type === 'multiply') out *= m.value
    }
    return {
      before: current,
      after: out,
      diff: out - current,
    }
  }
}
