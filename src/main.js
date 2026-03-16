import { loadAllConfigs } from './config/configManager.js';
import { initEnemyTypes } from './game/enemy/types/typeLoader.js';
import { initUpgrades } from './game/upgrades/index.js';
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
        } else {
            console.warn("⚠️ Canvas com ID 'game' não encontrado no HTML!");
        }
        console.log("📦 Carregando Configurações, Inimigos e Upgrades...");
        await Promise.all([
            loadAllConfigs(),
            initEnemyTypes(),
            initUpgrades()
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
