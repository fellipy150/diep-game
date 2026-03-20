export class WeaponBase {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.owner = null;
    }
    equip(player) {
        this.owner = player;
    }
    unequip() {
        this.owner = null;
    }
    update(_dt, _context) {
        throw new Error(`Arma [${this.name}] não implementou update()`);
    }
    draw(_ctx, _camera) {
    }
}
