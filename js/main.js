import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { getSpecialBulletsPool } from "./bullet.js"; // Updated import
import { loadAllConfigs } from "./configManager.js";

// 1. Canvas Configuration and Global Constants
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const GAME_WIDTH = 720; 
export const GAME_HEIGHT = 1280;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

export const camera = { x: 0, y: 0 };
export const enemies = [];

// 2. State Variables (Initialized after loading)
export let gameData = {};
export let input;
export let player;
let spawnTimer = 0;

/**
 * Main Entry Point
 */
async function start() {
    try {
        console.log("Starting resource loading...");
        
        // 1. Wait for configManager to load data
        const data = await loadAllConfigs();
        
        if (!data) {
            throw new Error("Critical Failure: Config data is empty.");
        }

        // Store data globally for other modules
        gameData = data;
        console.log("Configs applied successfully!");

        // 2. Initialize everything that depends on this data
        setupGame(); 

    } catch (err) {
        console.error("Error starting the game:", err);
    }
}

/**
 * Instantiates entities and starts the loop
 */
function setupGame() {
    // Initialize Input and Player
    input = new Input();
    player = new Player(500, 500);

    // Initial enemy spawns
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();

    // Start the game lifecycle
    startGameLoop();
}

// Trigger initial start
start();

// ==========================================
// SPAWN SYSTEM
// ==========================================

export function gerenciarSpawns(dt) {
    if (!player) return; 
    
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnEnemy();
        // Spawn interval gets shorter as player levels up
        spawnTimer = Math.max(0.5, 2.5 - (player.level * 0.1));
    }
}

function spawnEnemy() {
    const margin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);

    // Positioning logic (Outside the camera view)
    if (edge === 0) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y - margin; }
    else if (edge === 1) { spawnX = camera.x + (Math.random() * GAME_WIDTH); spawnY = camera.y + GAME_HEIGHT + margin; }
    else if (edge === 2) { spawnX = camera.x - margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }
    else { spawnX = camera.x + GAME_WIDTH + margin; spawnY = camera.y + (Math.random() * GAME_HEIGHT); }

    // --- DYNAMIC DIFFICULTY SYSTEM ---
    const maxDifficultyLevel = 20; 
    const progression = Math.min(1, (player.level - 1) / (maxDifficultyLevel - 1));

    // 1. AI Sorteio
    const aiTypes = ['aggressive', 'lost', 'sniper', 'strategic', 'melee', 'healer'];
    const normalAiType = 'lost';
    let selectedAI;
    
    // Convergence logic: 0.9 probability at Level 1, equal probability at Level 20
    const initialNormalAiProb = 0.9;
    const finalNormalAiProb = 1 / aiTypes.length;
    const currentNormalAiProb = initialNormalAiProb - (initialNormalAiProb - finalNormalAiProb) * progression;

    if (Math.random() < currentNormalAiProb) {
        selectedAI = normalAiType;
    } else {
        const harderAIs = aiTypes.filter(type => type !== normalAiType);
        selectedAI = harderAIs[Math.floor(Math.random() * harderAIs.length)];
    }

    // 2. Bullet Sorteio (Using the pool function)
    const pool = getSpecialBulletsPool();
    let selectedBullet = 'normal';
    
    const totalBulletTypes = pool.length + 1; // +1 for the 'normal' type
    const initialNormalBulletProb = 0.9;
    const finalNormalBulletProb = 1 / totalBulletTypes;
    const currentNormalBulletProb = initialNormalBulletProb - (initialNormalBulletProb - finalNormalBulletProb) * progression;

    if (Math.random() < currentNormalBulletProb) {
        selectedBullet = 'normal';
    } else {
        // Pick a random bullet from the special pool
        selectedBullet = pool[Math.floor(Math.random() * pool.length)];
    }

    enemies.push(new Enemy(spawnX, spawnY, selectedAI, selectedBullet));
}

