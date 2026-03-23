export const DOMManager = {
    init(player) {
        this.xpBar = document.getElementById('xp-bar');
        this.levelText = document.getElementById('level-text');
        this.hotbar = document.getElementById('hotbar');
        this.weightCurrent = document.getElementById('current-weight');
        this.weightMax = document.getElementById('max-weight');
        this.hotbar.addEventListener('pointerdown', (e) => {
            const slot = e.target.closest('.hotbar-slot');
            if (slot) {
                e.stopPropagation();
                const index = parseInt(slot.dataset.index);
                player.inventory.setActive(index);
                this.updateHotbar(player.inventory);
            }
        });
    },
    updateHUD(player) {
        const xpPercent = Math.min(100, (player.xp / player.xpNeeded) * 100);
        this.xpBar.style.width = `${xpPercent}%`;
        this.levelText.innerText = `Nível ${player.level}`;
        this.weightCurrent.innerText = player.inventory.currentWeight;
        this.weightMax.innerText = player.inventory.maxWeight;
        const isFull = player.inventory.currentWeight >= player.inventory.maxWeight;
        this.weightCurrent.style.color = isFull ? '#ffaa00' : '#aaa';
    },
    updateHotbar(inventory) {
        this.hotbar.innerHTML = '';
        inventory.weapons.forEach((weapon, index) => {
            const slot = document.createElement('div');
            slot.className = `hotbar-slot ${index === inventory.activeIndex ? 'active' : ''}`;
            slot.dataset.index = index;
            const display = weapon.icon || (weapon.name ? weapon.name.substring(0, 2).toUpperCase() : `W${index+1}`);
            slot.innerHTML = `
                ${display}
                <small>${weapon.weight || 1}KG</small>
            `;
            this.hotbar.appendChild(slot);
        });
    }
};
window.DOMManager = DOMManager;
