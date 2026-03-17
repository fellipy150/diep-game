export class Bullet {
    // Usamos o prefixo _ para indicar variáveis de contrato ignoradas
    constructor(x, y, _damage, _speed) {
        this.x = x; 
        this.y = y;
        this.dead = true; 
    }
    update() {}
    draw() {}
}
