import { Enemy } from './enemy/index.js';
import { getAllAvailableTypes } from './enemy/types/typeLoader.js';
import { BASE_FOV_WIDTH } from './renderer.js';
import { MathUtils } from '../core/math.js';

// --- CONFIGURAÇÕES DE PERFORMANCE ---
const MAX_ENEMIES = 15;      // Limite para manter a performance estável em browsers
const CULL_DIST_SQ = 1440000; // Distância de reciclagem (1200 * 1200)

export const EnemySpawner = {
    spawnTimer: 0,
    spawnInterval: 2.0,

    update(dt, gameState) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnEnemy(gameState);
            this.spawnTimer = this.spawnInterval;
            
            // Aumenta a dificuldade gradualmente diminuindo o intervalo
            this.spawnInterval = Math.max(0.5, this.spawnInterval * 0.98);
        }
    },

    /**
     * Algoritmo de "Melhor Candidato": Testa 4 pontos e escolhe o mais isolado
     * para evitar que inimigos nasçam empilhados.
     */
    getSmartSpawnPoint(player, enemies, rMin, rMax) {
        let bestPoint = null;
        let maxMinDistSq = -1;

        // Testamos 4 candidatos (equilíbrio entre qualidade e CPU)
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const randomSq = Math.random();
            const spawnRadius = Math.sqrt(randomSq * (rMax * rMax - rMin * rMin) + rMin * rMin);
            
            const px = player.x + Math.cos(angle) * spawnRadius;
            const py = player.y + Math.sin(angle) * spawnRadius;

            // Calcula a distância para o inimigo mais próximo deste ponto
            let minDistToEnemySq = Infinity;
            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                if (e.dead) continue;
                
                const dSq = MathUtils.distSq(px, py, e.x, e.y);
                if (dSq < minDistToEnemySq) minDistToEnemySq = dSq;
            }

            // O "melhor" ponto é aquele cujo vizinho mais próximo está o mais longe possível
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

        // 1. Definição do Tipo e Nível
        const availableTypes = getAllAvailableTypes();
        if (availableTypes.length === 0) return;
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const level = Math.max(1, player.level + (Math.floor(Math.random() * 3) - 1));

        // 2. Cálculo do Anel de Spawn (Baseado no FOV lógico)
        const scale = canvas.width / BASE_FOV_WIDTH;
        const logicalWidth = BASE_FOV_WIDTH;
        const logicalHeight = canvas.height / scale;
        const maxDimension = Math.max(logicalWidth, logicalHeight);
        
        const rMin = (maxDimension / 2) + 150; // Um pouco além da borda da tela
        const rMax = rMin + 400;

        // 3. Obtém o ponto de spawn inteligente
        const spawnPt = this.getSmartSpawnPoint(player, enemies, rMin, rMax);
        if (!spawnPt) return;

        // 🔴 4. LÓGICA DE RECICLAGEM (Object Pooling Dinâmico)
        if (enemies.length >= MAX_ENEMIES) {
            let furthestEnemy = null;
            let maxDistSq = 0;

            // Busca o inimigo vivo mais distante do jogador
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                const dSq = MathUtils.distSq(player.x, player.y, e.x, e.y);
                if (dSq > maxDistSq) {
                    maxDistSq = dSq;
                    furthestEnemy = e;
                }
            }

            // Se o inimigo mais distante estiver fora da "zona de ação" (Cull distance)
            // nós o teletransportamos e reiniciamos em vez de criar um novo objeto.
            if (furthestEnemy && maxDistSq > CULL_DIST_SQ) {
                // O método .init() deve ser implementado na classe Enemy
                furthestEnemy.init({
                    x: spawnPt.x,
                    y: spawnPt.y,
                    typeName: randomType,
                    level: level
                });
                return; // ♻️ Inimigo reciclado com sucesso!
            }
        }

        // 5. Spawn Normal (Caso ainda haja espaço no pool)
        if (enemies.length < MAX_ENEMIES) {
            const newEnemy = new Enemy(spawnPt.x, spawnPt.y, randomType, level);
            enemies.push(newEnemy);
        }
    }
};

