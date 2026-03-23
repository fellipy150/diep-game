export class GameContext {
    constructor(gameState = {}) {
        this.player = gameState.player || null;
        this.enemies = gameState.enemies || [];
        this.hazards = gameState.hazards || [];
        this.camera = gameState.camera || null;
        this.canvas = gameState.canvas || null;
        this.ctx = gameState.ctx || null;
    }
    addProjectile(p) {
        if (this.player && this.player.bullets) {
            this.player.bullets.push(p);
        }
    }
    spawnDamageNumber(x, y, val, color) {
        if (this.createDamageNumber) {
            this.createDamageNumber(x, y, val, color);
        }
    }
}
