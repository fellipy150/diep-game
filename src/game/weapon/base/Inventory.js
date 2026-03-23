export class Inventory {
    constructor(owner, initialCapacity = 1) {
        this.owner = owner; // O Player (ou Inimigo)
        this.weapons = [];
        this.activeIndex = 0;
        this.capacity = initialCapacity;
    }

    get currentWeight() {
        return this.weapons.reduce((sum, entry) => sum + (entry.weapon.weight || 1), 0);
    }

    canAddWeapon(weapon) {
        const w = weapon.weight || 1;
        return (this.currentWeight + w) <= this.capacity;
    }

    addWeapon(weapon) {
        if (!this.canAddWeapon(weapon)) {
            console.log("Peso excedido! Não pode carregar essa arma.");
            return false;
        }

        // 🔴 CORREÇÃO CRÍTICA: Define o dono da arma antes de guardar.
        // Assim a arma consegue acessar stats (dano, fireRate) do Player ou Inimigo.
        weapon.owner = this.owner; 

        this.weapons.push({ weapon: weapon });
        
        // Equipa automaticamente a arma recém-adicionada
        this.equip(this.weapons.length - 1);
        return true;
    }

    equip(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.activeIndex = index;
        }
    }

    getActiveWeapon() {
        if (this.weapons.length === 0) return null;
        return this.weapons[this.activeIndex].weapon;
    }

    update(dt, context) {
        for (let i = 0; i < this.weapons.length; i++) {
            this.weapons[i].weapon.update(dt, context);
        }
    }
}


