import { Enemy } from './enemy/index.js';
import { getAllAvailableTypes } from './enemy/types/typeLoader.js';

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
            let spawnX, spawnY;
            if (player && !player.dead) {
                const angle = Math.random() * Math.PI * 2;
                const maxDimension = Math.max(canvas.width, canvas.height);
                const rMin = (maxDimension / 2) + 100;
                const rMax = rMin + 400;
                const randomSq = Math.random();
                const spawnRadius = Math.sqrt(randomSq * (rMax * rMax - rMin * rMin) + rMin * rMin);
                spawnX = player.x + Math.cos(angle) * spawnRadius;
                spawnY = player.y + Math.sin(angle) * spawnRadius;
            } else {
                spawnX = Math.random() * 2000;
                spawnY = Math.random() * 2000;
            }
            let level = 1;
            if (player) {
                level = Math.max(1, player.level + (Math.floor(Math.random() * 3) - 1));
            }
            const newEnemy = new Enemy(spawnX, spawnY, randomType, level);
            gameState.enemies.push(newEnemy);
        }
};
