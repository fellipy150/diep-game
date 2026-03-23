import { loadAllConfigs } from './config/configManager.js';
import { assets } from "./core/AssetLoader.js";
import { initEnemyTypes } from './game/enemy/types/typeLoader.js';
import { UpgradeSystem } from './game/upgrades/index.js';
import { startGameLoop } from './game/gameLoop.js';
// true = Alta Resolução (HD/Retina) -> Mais bonito, exige mais do celular
export const ENABLE_HD_GRAPHICS = false;
async function bootstrap() {
    try {
        console.group("🚀 Iniciando Boot do Jogo");
        const canvas = document.getElementById('game');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const resizeCanvas = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                const dpr = ENABLE_HD_GRAPHICS ? (window.devicePixelRatio || 1) : 1;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            };
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
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
