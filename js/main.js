import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { SPECIAL_BULLETS_POOL } from "./bullet.js";

// 1. Configuração do Canvas
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// Resolução Lógica (Proporção de Telemóvel)
export const GAME_WIDTH = 720; 
export const GAME_HEIGHT = 1280;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 2. Sistema de Câmara
export const camera = { x: 0, y: 0 };

// 3. Inicialização de Sistemas e Entidades
export const input = new Input();
export const player = new Player(500, 500);

// Array de inimigos ativos
export const enemies = [];

// 4. Sistema de Spawner (Gerador de Inimigos)
let spawnTimer = 0;

export function gerenciarSpawns(dt) {
    spawnTimer -= dt;
    
    if (spawnTimer <= 0) {
        spawnEnemy();
        
        // O tempo entre spawns diminui conforme o nível do jogador (Fica mais difícil!)
        // Começa com 1 inimigo a cada 2.5 segundos. O limite mínimo é 0.5 segundos.
        spawnTimer = Math.max(0.5, 2.5 - (player.level * 0.1));
    }
}

function spawnEnemy() {
    const margin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);

    // Lógica de coordenadas fora da visão da câmara
    if (edge === 0) { 
        spawnX = camera.x + (Math.random() * GAME_WIDTH); 
        spawnY = camera.y - margin; 
    } else if (edge === 1) { 
        spawnX = camera.x + (Math.random() * GAME_WIDTH); 
        spawnY = camera.y + GAME_HEIGHT + margin; 
    } else if (edge === 2) { 
        spawnX = camera.x - margin; 
        spawnY = camera.y + (Math.random() * GAME_HEIGHT); 
    } else { 
        spawnX = camera.x + GAME_WIDTH + margin; 
        spawnY = camera.y + (Math.random() * GAME_HEIGHT); 
    }

    // --- SISTEMA DE DIFICULDADE DINÂMICA ---
    
    // Define em qual nível a dificuldade máxima (distribuição igual) é atingida
    const maxDifficultyLevel = 20; 
    const progression = Math.min(1, (player.level - 1) / (maxDifficultyLevel - 1));

    // 1. SORTEIO DE I.A. (Progressão de Inteligência)
    const aiTypes = ['aggressive', 'lost', 'sniper', 'strategic', 'melee', 'healer'];
    const normalAiType = 'lost'; // Definimos 'lost' como a I.A. "Normal/Fácil"
    
    let selectedAI;
    const initialNormalAiProb = 0.9; // No início, 90% são bobos ('lost')
    const finalNormalAiProb = 1 / aiTypes.length; // No lvl 20, a chance é igual para todos
    
    // Interpolação linear da probabilidade baseada no nível
    const currentNormalAiProb = initialNormalAiProb - (initialNormalAiProb - finalNormalAiProb) * progression;

    if (Math.random() < currentNormalAiProb) {
        selectedAI = normalAiType;
    } else {
        // Sorteia entre as I.As restantes (especializadas e mais letais)
        const harderAIs = aiTypes.filter(type => type !== normalAiType);
        selectedAI = harderAIs[Math.floor(Math.random() * harderAIs.length)];
    }

    // 2. SORTEIO DE BALAS (Progressão de Arsenal)
    let selectedBullet;
    const initialNormalBulletProb = 0.9; // No início, 90% usam balas comuns
    const totalBulletTypes = SPECIAL_BULLETS_POOL.length + 1; // +1 para a 'normal'
    const finalNormalBulletProb = 1 / totalBulletTypes;

    const currentNormalBulletProb = initialNormalBulletProb - (initialNormalBulletProb - finalNormalBulletProb) * progression;

    if (Math.random() < currentNormalBulletProb) {
        selectedBullet = 'normal';
    } else {
        // Sorteia uma munição especial da pool disponível
        selectedBullet = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
    }

    // Criar e adicionar o novo inimigo com os atributos sorteados
    enemies.push(new Enemy(spawnX, spawnY, selectedAI, selectedBullet));
}

// Inicialização: 3 inimigos iniciais para começar a ação
spawnEnemy();
spawnEnemy();
spawnEnemy();

// 5. Iniciar o loop principal do jogo
startGameLoop();
