// Classes temporárias para não quebrar o jogo
export class Bullet {
    constructor() { this.dead = true; } // Nascem mortas
    update() {}
    draw() {}
}
export class LobbedProjectile extends Bullet {}
