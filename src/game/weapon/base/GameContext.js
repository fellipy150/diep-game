export class GameContext {
    constructor(gameState) {
        this.player = gameState.player;
        this.enemies = gameState.enemies;
        this.hazards = gameState.hazards;
        this.camera = gameState.camera; // Referência para trepidação ou foco
        this.canvas = gameState.canvas;
        this.ctx = gameState.ctx;
    }

    // Atalho seguro para a arma criar projéteis
    addProjectile(p) {
        if (this.player && this.player.bullets) {
            this.player.bullets.push(p);
        }
    }

    // Atalho para UI de dano
    spawnDamageNumber(x, y, val, color) {
        // Importação dinâmica ou via callback para evitar circular dependency
        if (this.createDamageNumber) this.createDamageNumber(x, y, val, color);
    }
}
