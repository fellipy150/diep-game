import { getSynergyHint } from '../synergies/index.js'

export const DOMManager = {
  _cache: { xp: -1, level: -1, weight: -1, maxWeight: -1 },
  init() {
    this.xpBar = document.getElementById('xp-bar')
    this.levelText = document.getElementById('level-text')
    this.hotbar = document.getElementById('hotbar')
    this.weightContainer = document.getElementById('weight-bar-container')
    this.levelUpModal = document.getElementById('level-up-modal')
    this.upgradeChoices = document.getElementById('upgrade-choices')
    if (this.hotbar && !this._isHotbarListenerAdded) {
      this.hotbar.addEventListener('pointerdown', e => {
        const slot = e.target.closest('.hotbar-slot')
        if (slot) {
          e.stopPropagation()
          const currentPlayer = window.gameState?.player
          if (currentPlayer && currentPlayer.inventory) {
            const index = parseInt(slot.dataset.index)
            currentPlayer.inventory.equip(index)
            this.updateHotbar(currentPlayer.inventory)
          }
        }
      })
      this._isHotbarListenerAdded = true
    }
    this.synergyToast = document.getElementById('synergy-toast')
    this.toastTitle = document.getElementById('synergy-toast-title')
    this.toastDesc = document.getElementById('synergy-toast-desc')
    this.gameOverModal = document.getElementById('game-over-modal')
    this.gameOverStats = document.getElementById('game-over-stats')
    const restartBtn = document.getElementById('restart-button')
    if (restartBtn && !this._isRestartListenerAdded) {
      restartBtn.addEventListener('pointerdown', () => window.location.reload())
      this._isRestartListenerAdded = true
    }
  },
  updateHUD(player) {
    if (this._cache.xp !== player.xp) {
      const xpPercent = (player.xp / player.xpNeeded) * 100
      this.xpBar.style.width = `${xpPercent}%`
      this._cache.xp = player.xp
    }
    if (this._cache.level !== player.level) {
      this.levelText.innerText = `Nível ${player.level}`
      this._cache.level = player.level
    }
    if (
      this._cache.weight !== player.inventory.currentWeight ||
      this._cache.maxWeight !== player.inventory.capacity
    ) {
      this.renderizarBarraDePeso(player.inventory)
      this._cache.weight = player.inventory.currentWeight
      this._cache.maxWeight = player.inventory.capacity
    }
  },
  renderizarBarraDePeso(inventory) {
    if (!this.weightContainer) return
    const capacity = inventory.capacity
    const used = inventory.currentWeight
    this.weightContainer.innerHTML = ''
    for (let i = 0; i < capacity; i++) {
      const segment = document.createElement('div')
      segment.className = 'weight-segment'
      if (i < used) {
        segment.classList.add('used')
      }
      this.weightContainer.appendChild(segment)
    }
  },
  updateHotbar(inventory) {
    if (!this.hotbar) return
    this.hotbar.innerHTML = ''
    inventory.weapons.forEach((entry, index) => {
      const slot = document.createElement('div')
      slot.className = `hotbar-slot ${index === inventory.activeIndex ? 'active' : ''}`
      slot.dataset.index = index
      const iconUrl =
        entry.weapon.icon && entry.weapon.icon.endsWith('.png')
          ? `url('${entry.weapon.icon}')`
          : 'none'
      slot.innerHTML = `
                <div class="slot-icon" style="background-image: ${iconUrl};">${!entry.weapon.icon ? '🔫' : ''}</div>
                <span class="slot-ammo">${Math.floor(entry.weapon.currentAmmo)}/${entry.weapon.magSize}</span>
            `
      this.hotbar.appendChild(slot)
    })
  },
  updateAmmoUI(inventory) {
    const slots = this.hotbar.querySelectorAll('.hotbar-slot')
    inventory.weapons.forEach((entry, index) => {
      const weapon = entry.weapon
      const ammoDisplay = slots[index]?.querySelector('.slot-ammo')
      if (ammoDisplay) {
        const current = Math.floor(weapon.currentAmmo)
        ammoDisplay.innerText = `${current}/${weapon.magSize}`
        if (current === 0) {
          ammoDisplay.style.color = '#ff4444'
          ammoDisplay.style.fontWeight = 'bold'
        } else {
          ammoDisplay.style.color = 'white'
          ammoDisplay.style.fontWeight = 'normal'
        }
      }
    })
  },
  showLevelUpModal(player, choices, onSelectCallback) {
    if (!this.levelUpModal || !this.upgradeChoices) return
    this.upgradeChoices.innerHTML = ''
    const h2 = this.levelUpModal.querySelector('h2')
    if (h2) h2.innerText = 'NÍVEL CONCLUÍDO - ESCOLHA UM UPGRADE'
    const rarityColors = {
      common: 'var(--rarity-common)',
      uncommon: 'var(--rarity-uncommon)',
      rare: 'var(--rarity-rare)',
      epic: 'var(--rarity-epic)',
      legendary: 'var(--rarity-legendary)',
    }
    choices.forEach(up => {
      const card = document.createElement('div')
      const rarity = up.rarity || 'common'
      card.className = `upgrade-card ${rarity}`
      let previewHtml = ''
      if (up.modifier && player && player.stats) {
        const { before, after } = player.stats.getPreview(
          up.modifier.stat,
          up.modifier
        )
        previewHtml = `
                    <div class="stat-preview">
                        <span style="font-size: 12px; color: #bdc3c7;">${up.modifier.stat.toUpperCase()}</span><br>
                        <b style="color: #ff7675;">${before.toFixed(1)}</b>
                        <span style="color: #fff;">➔</span>
                        <b style="color: #55efc4;">${after.toFixed(1)}</b>
                    </div>`
      }
      const hint = getSynergyHint(player, up)
      const hintHtml = hint
        ? `<div class="synergy-hint">✨ PEÇA PARA: ${hint.name.toUpperCase()}</div>`
        : ''
      card.innerHTML = `
                <div class="rarity-tag" style="background: ${rarityColors[rarity]};">
                    ${rarity.toUpperCase()}
                </div>
                <h3>${up.name}</h3>
                <p>${up.description}</p>
                ${previewHtml}
                ${hintHtml}
            `
      card.addEventListener('pointerdown', e => {
        e.stopPropagation()
        this.hideLevelUpModal()
        onSelectCallback(up.id)
      })
      this.upgradeChoices.appendChild(card)
    })
    this.levelUpModal.classList.remove('hidden')
    this.levelUpModal.style.pointerEvents = 'auto'
  },
  hideLevelUpModal() {
    if (this.levelUpModal) {
      this.levelUpModal.classList.add('hidden')
      this.levelUpModal.style.pointerEvents = 'none'
    }
  },
  showSynergyToast(title, description) {
    if (!this.synergyToast) return
    this.toastTitle.innerText = title
    this.toastDesc.innerText = description
    this.synergyToast.classList.remove('hidden-toast')
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => {
      this.synergyToast.classList.add('hidden-toast')
    }, 3500)
  },
  showGameOver(level) {
    if (!this.gameOverModal) return
    if (this.gameOverStats) {
      this.gameOverStats.innerText = `Você sobreviveu até o Nível ${level}`
    }
    this.gameOverModal.classList.remove('hidden')
  },
}
window.DOMManager = DOMManager
