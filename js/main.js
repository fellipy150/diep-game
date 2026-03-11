import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { SPECIAL_BULLETS_POOL } from "./bullet.js";

// 1. Configuração do Canvas e Constantes Globais
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const GAME_WIDTH = 720; 
export const GAME_HEIGHT = 1280;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

export const camera = { x: 0, y: 0 };
export const enemies = [];

// 2. Variáveis de Estado e Dados
export let gameData = {};
export let input;
export let player;

// 3. Inicialização Assíncrona
async function initGame() {
    try {
        console.log("Carregando configurações...");
        // Carrega todos os JSONs simultaneamente
        const [bullets, upgrades, enemiesConfig, synergies] = await Promise.all([
            fetch('./js/config_bullets.json').then(r => r.json()),
            fetch('./js/config_upgrades.json').then(r => r.json()),
            fetch('./js/config_enemies.json').then(r => r.json()),
            fetch('./js/config_synergies.json').then(r => r.json())
        ]);

        gameData = { bullets, upgrades, enemies: enemiesConfig, synergies };
        console.log("Configurações carregadas com sucesso!");

        // Só inicia as entidades e o loop DEPOIS que os dados chegarem
        setupEntities();
        startGameLoop();
    } catch (err) {
        console.error("Erro crítico ao carregar configurações do jogo:", err);
        // Dica: Verifique se os arquivos JSON estão na pasta correta e se o servidor local está ativo
    }
}

// Inicializa o processo
initGame();

// 4. Configuração de Entidades
function setupEntities() {
    input = new Input();
    player = new Player(500, 500);

    // Começa com 3 inimigos iniciais espalhados
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();
}

// 5. Sistema de Spawner (Gerador de Inimigos)
let spawnTimer = 0;

export function gerenciarSpawns(dt) {
    if (!player) return; // Segurança caso o loop comece sem o player
    
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnEnemy();
        // O tempo entre spawns diminui conforme o nível do jogador
        spawnTimer = Math.max(0.5, 2.5 - (player.level * 0.1));
    }
}

function spawnEnemy() {
    const margin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y - margin; }
    else if (edge === 1) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y + GAME_HEIGHT + margin; }
    else if (edge === 2) { spawnX = camera.x - margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }
    else { spawnX = camera.x + GAME_WIDTH + margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }

    // --- SISTEMA DE DIFICULDADE DINÂMICA ---
    const maxDifficultyLevel = 20; 
    const progression = Math.min(1, (player.level - 1) / (maxDifficultyLevel - 1));

    // 1. SORTEIO DE I.A.
    const aiTypes = ['aggressive', 'lost', 'sniper', 'strategic', 'melee', 'healer'];
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

    // 2. SORTEIO DE BALAS
    let selectedBullet;
    const initialNormalBulletProb = 0.9;
    const totalBulletTypes = SPECIAL_BULLETS_POOL.length + 1;
    const finalNormalBulletProb = 1 / totalBulletTypes;

    const currentNormalBulletProb = initialNormalBulletProb - (initialNormalBulletProb - finalNormalBulletProb) * progression;

    if (Math.random() < currentNormalBulletProb) {
        selectedBullet = 'normal';
    } else {
        selectedBullet = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
    }

    enemies.push(new Enemy(spawnX, spawnY, selectedAI, selectedBullet));
}
