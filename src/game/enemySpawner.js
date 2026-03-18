import { Enemy } from './enemy/index.js';
import { getAllAvailableTypes } from './enemy/types/typeLoader.js';

// 🔴 Mantemos a mesma constante lógica do Renderizador
const BASE_FOV_WIDTH = 1000; 

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
            
            // 🔴 NOVA MATEMÁTICA DE SPAWN: Usa a escala lógica, não os pixels físicos!
            const scale = canvas.width / BASE_FOV_WIDTH;
            const logicalWidth = BASE_FOV_WIDTH;
            const logicalHeight = canvas.height / scale;
            
            // Pega a maior dimensão lógica para garantir que nasça fora da tela
            const maxDimension = Math.max(logicalWidth, logicalHeight);
            
            // rMin = Borda da tela + 100 unidades de folga de segurança
            const rMin = (maxDimension / 2) + 100;
            const rMax = rMin + 400; // Espalha o spawn em uma faixa de 400 unidades
            
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
