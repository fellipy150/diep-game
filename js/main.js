import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { SPECIAL_BULLETS_POOL } from "./bullet.js";
import { loadAllConfigs } from "./configManager.js";

// 1. Configuração do Canvas e Constantes Globais
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const GAME_WIDTH = 720; 
export const GAME_HEIGHT = 1280;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

export const camera = { x: 0, y: 0 };
export const enemies = [];

// 2. Variáveis de Estado (Inicializadas após o carregamento)
export let gameData = {};
export let input;
export let player;

/**
 * Ponto de entrada principal
 */
async function start() {
    try {
        console.log("Iniciando carregamento de recursos...");
        
        // 1. Espera os dados carregarem do configManager
        const data = await loadAllConfigs();
        
        if (!data) {
            throw new Error("Falha crítica: Dados de configuração vazios.");
        }

        // Armazena os dados globalmente para outros módulos
        gameData = data;
        console.log("Configurações aplicadas com sucesso!");

        // 2. Só agora inicializamos o que depende desses dados
        setupGame(); 

    } catch (err) {
        console.error("Erro ao iniciar o jogo:", err);
    }
}

/**
 * Instancia entidades e inicia o loop
 */
function setupGame() {
    // Inicializa Input e Player (que agora podem ler o gameData)
    input = new Input();
    player = new Player(500, 500);

    // Criação dos inimigos iniciais
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();

    // Inicia o ciclo de vida do jogo
    startGameLoop();
}

// Dispara o gatilho inicial
start();

// ==========================================
// SISTEMA DE SPAWN
// ==========================================

export function gerenciarSpawns(dt) {
    if (!player) return; 
    
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(0.5, 2.5 - (player.level * 0.1));
    }
}

let spawnTimer = 0;

function spawnEnemy() {
    const margin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);

    // Lógica de posicionamento (fora da tela)
    if (edge === 0) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y - margin; }
    else if (edge === 1) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y + GAME_HEIGHT + margin; }
    else if (edge === 2) { spawnX = camera.x - margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }
    else { spawnX = camera.x + GAME_WIDTH + margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }

    // --- SISTEMA DE DIFICULDADE DINÂMICA ---
    const maxDifficultyLevel = 20; 
    const progression = Math.min(1, (player.level - 1) / (maxDifficultyLevel - 1));

    // Sorteio de I.A.
    const aiTypes = ['aggressive', 'lost', 'sniper', 'strategic', 'melee', 'healer'];
    const normalAiType = 'lost';
    let selectedAI;
    const currentNormalAiProb = 0.9 - (0.9 - (1 / aiTypes.length)) * progression;

    if (Math.random() < currentNormalAiProb) {
        selectedAI = normalAiType;
    } else {
        const harderAIs = aiTypes.filter(type => type !== normalAiType);
        selectedAI = harderAIs[Math.floor(Math.random() * harderAIs.length)];
    }

    // Sorteio de Balas
    let selectedBullet;
    const totalBulletTypes = SPECIAL_BULLETS_POOL.length + 1;
    const currentNormalBulletProb = 0.9 - (0.9 - (1 / totalBulletTypes)) * progression;

    if (Math.random() < currentNormalBulletProb) {
        selectedBullet = 'normal';
    } else {
        selectedBullet = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
    }

    enemies.push(new Enemy(spawnX, spawnY, selectedAI, selectedBullet));
}
