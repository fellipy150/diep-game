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

    // Métodos obrigatórios para sobrescrever
    update(_dt, _context) {
        throw new Error(`Arma [${this.name}] não implementou update()`);
    }

    draw(_ctx, _camera) {
        // Opcional: Desenhar a arma na mão do player
    }
}
