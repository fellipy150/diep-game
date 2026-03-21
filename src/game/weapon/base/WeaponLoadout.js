export class WeaponLoadout {
    constructor(owner, initialSlots = 2) {
        this.owner = owner;
        this.slots = initialSlots;
        this.weapons = []; // Array de { weapon, slotCost }
        this.activeIndex = 0;
        this.swapCooldown = 0.3;
        this.swapTimer = 0;
    }

    update(dt) {
        if (this.swapTimer > 0) this.swapTimer -= dt;
        
        // Mantém todas as armas (inclusive passivas) atualizadas
        this.weapons.forEach((entry, index) => {
            // Se for a ativa OU se tiver custo 0 (passiva), ela roda o update
            if (index === this.activeIndex || entry.slotCost === 0) {
                // Passamos o loadout no context para sinergias futuras
                entry.weapon.update(dt, { ...this.owner.context, loadout: this });
            }
        });
    }

    addWeapon(weapon, slotCost = 1) {
        const currentTotal = this.weapons.reduce((sum, w) => sum + w.slotCost, 0);
        if (currentTotal + slotCost <= this.slots) {
            this.weapons.push({ weapon, slotCost });
            weapon.equip(this.owner);
            return true;
        }
        console.warn("🚫 Sem slots suficientes para:", weapon.name);
        return false;
    }

    swap() {
        if (this.swapTimer > 0 || this.weapons.length <= 1) return;

        const oldWeapon = this.getActiveWeapon();
        if (oldWeapon) oldWeapon.unequip();

        // Busca a próxima arma que NÃO seja passiva (slotCost > 0)
        let nextIndex = (this.activeIndex + 1) % this.weapons.length;
        while (this.weapons[nextIndex].slotCost === 0 && nextIndex !== this.activeIndex) {
            nextIndex = (nextIndex + 1) % this.weapons.length;
        }

        this.activeIndex = nextIndex;
        this.swapTimer = this.swapCooldown;
        
        const newWeapon = this.getActiveWeapon();
        newWeapon.equip(this.owner);
        
        console.log(`🔁 Swap: ${newWeapon.name}`);
    }

    getActiveWeapon() {
        return this.weapons[this.activeIndex]?.weapon || null;
    }

    getNextWeaponPreview() {
        if (this.weapons.length <= 1) return null;
        let nextIndex = (this.activeIndex + 1) % this.weapons.length;
        while (this.weapons[nextIndex].slotCost === 0) {
            nextIndex = (nextIndex + 1) % this.weapons.length;
        }
        return this.weapons[nextIndex].weapon;
    }
}
