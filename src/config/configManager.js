import { enemyConfigs } from '../entities/enemy/configs/index.js';
import { bulletConfigs } from '../entities/projectiles/configs/index.js';

export const gameData = {
    enemies: enemyConfigs,
    bullets: bulletConfigs || {},
    upgrades: {},
    synergies: {}
};

export const loadAllConfigs = () => {
    console.log("🚀 Sistema Modular de Maestros Carregado!");
    return Promise.resolve(gameData);
};
