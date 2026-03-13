import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { getSpecialBulletsPool } from "./bullet.js"; 
import { loadAllConfigs } from "./configManager.js";
// CORREÇÃO: Importar a câmera atualizada diretamente do renderer!
import { camera } from "./renderer.js"; 

// 1. Configuração do Canvas
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// Resolução do jogo
export const GAME_WIDTH = 720; 
export const GAME_HEIGHT = 1280;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

export const enemies = [];
export const MAX_ENEMIES = 60; // Trava de segurança para salvar o FPS

// 2. Variáveis de Estado
export let gameData = {};
export let input;
export let player;
let spawnTimer = 0;

/**
 * Ponto de Entrada (Boot)
 */
async function start() {
    try {
        console.log("Carregando recursos...");
        const data = await loadAllConfigs();
        
        if (!data) throw new Error("Falha Crítica: JSONs de configuração vazios.");

        gameData = data;
        console.log("Configurações aplicadas com sucesso!");

        setupGame(); 
    } catch (err) {
        console.error("Erro ao iniciar o jogo:", err);
    }
}

/**
 * Instancia entidades e liga o motor
 */
function setupGame() {
    input = new Input();
    player = new Player(500, 500);

    // Spawns iniciais
    spawnEnemy(); 
    spawnEnemy(); 
    spawnEnemy();

    startGameLoop();
}

start();

// ==========================================
// SISTEMA DE SPAWN
// ==========================================

export function gerenciarSpawns(dt) {
    if (!player) return; 
    
    // CORREÇÃO: Cap de entidades para evitar a morte da CPU
    if (enemies.length >= MAX_ENEMIES) return;
    
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnEnemy();
        // Nível 1: 2.5s | Nível 20+: 0.5s
        spawnTimer = Math.max(0.5, 2.5 - (player.level * 0.1));
    }
}

function spawnEnemy() {
    const margin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);

    // Agora usa a câmera real importada do renderer.js
    if (edge === 0) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y - margin; }
    else if (edge === 1) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y + GAME_HEIGHT + margin; }
    else if (edge === 2) { spawnX = camera.x - margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }
    else { spawnX = camera.x + GAME_WIDTH + margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }

    // --- SISTEMA DE DIFICULDADE DINÂMICA ---
    const maxDifficultyLevel = 20; 
    const progression = Math.min(1, (player.level - 1) / (maxDifficultyLevel - 1));

    // 1. Sorteio de IA Dinâmico (Lido direto do JSON!)
    const aiTypes = Object.keys(gameData.enemies.aiTypes);
    const normalAiType = 'lost';
    let selectedAI;
    
    const initialNormalAiProb = 0.9;
    const finalNormalAiProb = 1 / aiTypes.length;
    const currentNormalAiProb = initialNormalAiProb - (initialNormalAiProb - finalNormalAiProb) * progression;

    if (Math.random() < currentNormalAiProb) {
        selectedAI = normalAiType;
    } else {
        const harderAIs = aiTypes.filter(type => type !== normalAiType);
        selectedAI = harderAIs[Math.floor(Math.random() * harderAIs.length)];
    }

    // 2. Sorteio de Balas
    const pool = getSpecialBulletsPool();
    let selectedBullet = 'normal';
    
    const totalBulletTypes = pool.length + 1; 
    const initialNormalBulletProb = 0.9;
    const finalNormalBulletProb = 1 / totalBulletTypes;
    const currentNormalBulletProb = initialNormalBulletProb - (initialNormalBulletProb - finalNormalBulletProb) * progression;

    if (Math.random() < currentNormalBulletProb || pool.length === 0) {
        selectedBullet = 'normal';
    } else {
        selectedBullet = pool[Math.floor(Math.random() * pool.length)];
    }

    enemies.push(new Enemy(spawnX, spawnY, selectedAI, selectedBullet));
}
