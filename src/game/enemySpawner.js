import { Enemy } from '../entities/enemy/index.js';
import { getAllAvailableTypes } from '../entities/enemy/types/typeLoader.js';
export const EnemySpawner = {
    spawnTimer: 0,
    spawnInterval: 2.0,
    update(dt, gameState) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnEnemy(gameState);
            this.spawnTimer = this.spawnInterval;
            this.spawnInterval = Math.max(0.5, this.spawnInterval * 0.98);
        }
    },
    spawnEnemy(gameState) {
        const availableTypes = getAllAvailableTypes();
        if (availableTypes.length === 0) return;
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const { canvas, player } = gameState;
        const spawnX = Math.random() * canvas.width;
        const spawnY = Math.random() * canvas.height;
        let level = 1;
        if (player) {
            level = Math.max(1, player.level + (Math.floor(Math.random() * 3) - 1));
        }
        const newEnemy = new Enemy(spawnX, spawnY, randomType, level);
        gameState.enemies.push(newEnemy);
    }
};
