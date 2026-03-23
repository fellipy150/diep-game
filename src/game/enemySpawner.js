import { Enemy } from './enemy/index.js';
import { getAllAvailableTypes } from './enemy/types/typeLoader.js';
import { BASE_FOV_WIDTH } from './renderer.js';
import { MathUtils } from '../core/math.js';

const MAX_ENEMIES = 15;
const CULL_DIST_SQ = 1440000;
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
    getSmartSpawnPoint(player, enemies, rMin, rMax) {
        let bestPoint = null;
        let maxMinDistSq = -1;
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const randomSq = Math.random();
            const spawnRadius = Math.sqrt(randomSq * (rMax * rMax - rMin * rMin) + rMin * rMin);
            const px = player.x + Math.cos(angle) * spawnRadius;
            const py = player.y + Math.sin(angle) * spawnRadius;
            let minDistToEnemySq = Infinity;
            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                if (e.dead) continue;
                const dSq = MathUtils.distSq(px, py, e.x, e.y);
                if (dSq < minDistToEnemySq) minDistToEnemySq = dSq;
            }
            if (minDistToEnemySq > maxMinDistSq) {
                maxMinDistSq = minDistToEnemySq;
                bestPoint = { x: px, y: py };
            }
        }
        return bestPoint;
    },
    spawnEnemy(gameState) {
        const { enemies, player, canvas } = gameState;
        if (!player || player.dead) return;
        const availableTypes = getAllAvailableTypes();
        if (availableTypes.length === 0) return;
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const level = Math.max(1, player.level + (Math.floor(Math.random() * 3) - 1));
        const scale = canvas.width / BASE_FOV_WIDTH;
        const logicalWidth = BASE_FOV_WIDTH;
        const logicalHeight = canvas.height / scale;
        const maxDimension = Math.max(logicalWidth, logicalHeight);
        const rMin = (maxDimension / 2) + 150; // Um pouco além da borda da tela
        const rMax = rMin + 400;
        const spawnPt = this.getSmartSpawnPoint(player, enemies, rMin, rMax);
        if (!spawnPt) return;
        if (enemies.length >= MAX_ENEMIES) {
            let furthestEnemy = null;
            let maxDistSq = 0;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                const dSq = MathUtils.distSq(player.x, player.y, e.x, e.y);
                if (dSq > maxDistSq) {
                    maxDistSq = dSq;
                    furthestEnemy = e;
                }
            }
            if (furthestEnemy && maxDistSq > CULL_DIST_SQ) {
                furthestEnemy.init({
                    x: spawnPt.x,
                    y: spawnPt.y,
                    typeName: randomType,
                    level: level
                });
                return;
            }
        }
        if (enemies.length < MAX_ENEMIES) {
            const newEnemy = new Enemy(spawnPt.x, spawnPt.y, randomType, level);
            enemies.push(newEnemy);
        }
    }
};
