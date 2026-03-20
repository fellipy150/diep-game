import { loadAllConfigs } from './config/configManager.js';
import { assets } from "./core/AssetLoader.js";
import { initEnemyTypes } from './game/enemy/types/typeLoader.js';
import { UpgradeSystem } from './game/upgrades/index.js';
import { startGameLoop } from './game/gameLoop.js';

async function bootstrap() {
    try {
        console.group("🚀 Iniciando Boot do Jogo");
        const canvas = document.getElementById('game');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        }
        console.log("📦 Carregando Assets, Configurações e Sistemas...");
        await Promise.all([
            loadAllConfigs(),
            assets.loadAll(),
            initEnemyTypes(),
            UpgradeSystem.init()
        ]);
        console.log("✅ Boot concluído com sucesso!");
        console.groupEnd();
        startGameLoop();
    } catch (err) {
        console.error("❌ Falha Crítica no Boot:", err);
        console.groupEnd();
    }
}
bootstrap();
