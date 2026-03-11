import { startGameLoop } from "./gameLoop.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Input } from "./input.js";
import { SPECIAL_BULLETS_POOL } from "./bullet.js";

// 1. Configuração do Canvas
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// Resolução Lógica (Proporção de Telemóvel)
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 2. Sistema de Câmara
export const camera = { x: 0, y: 0 };

// 3. Inicialização de Sistemas e Entidades
export const input = new Input();
export const player = new Player(500, 500);

// Substituímos o inimigo único por uma Array de inimigos!
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
    // Margem de segurança para nascer fora do ecrã
    const margin = 100;
    let spawnX, spawnY;

    // Sorteia um lado do ecrã: 0=Cima, 1=Baixo, 2=Esquerda, 3=Direita
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) { // Cima
        spawnX = camera.x + (Math.random() * GAME_WIDTH);
        spawnY = camera.y - margin;
    } else if (edge === 1) { // Baixo
        spawnX = camera.x + (Math.random() * GAME_WIDTH);
        spawnY = camera.y + GAME_HEIGHT + margin;
    } else if (edge === 2) { // Esquerda
        spawnX = camera.x - margin;
        spawnY = camera.y + (Math.random() * GAME_HEIGHT);
    } else { // Direita
        spawnX = camera.x + GAME_WIDTH + margin;
        spawnY = camera.y + (Math.random() * GAME_HEIGHT);
    }

    // Sorteia a Inteligência Artificial
    const aiTypes = ['agressivo', 'perdido', 'sniper', 'estrategico', 'corpo_a_corpo', 'cura'];
    const randomAI = aiTypes[Math.floor(Math.random() * aiTypes.length)];

    // Sorteia a Munição Especial (25% de chance base + 2% extra por cada nível do jogador)
    let randomBullet = 'comum';
    const specialChance = 0.25 + (player.level * 0.02); 
    
    if (Math.random() < specialChance) {
        randomBullet = SPECIAL_BULLETS_POOL[Math.floor(Math.random() * SPECIAL_BULLETS_POOL.length)];
    }

    // Cria e adiciona o novo inimigo ao mundo
    enemies.push(new Enemy(spawnX, spawnY, randomAI, randomBullet));
}

// Começa com 3 inimigos iniciais espalhados para o jogador não começar sozinho
spawnEnemy();
spawnEnemy();
spawnEnemy();

// 5. Iniciar o jogo
startGameLoop();


