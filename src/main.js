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
            const ctx = canvas.getContext('2d'); // 🔴 Pegamos o contexto para poder escalá-lo

            const resizeCanvas = () => {
                // 1. Pega o tamanho real e visível da janela
                const width = window.innerWidth;
                const height = window.innerHeight;
                
                // 2. Pega o multiplicador de pixels da tela (ex: 2 ou 3 em celulares modernos)
                const dpr = window.devicePixelRatio || 1;

                // 3. Define o tamanho físico (CSS) do elemento na tela
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                // 4. Aumenta a resolução interna do canvas para HD
                canvas.width = width * dpr;
                canvas.height = height * dpr;

                // 5. Escala o contexto para o jogo não ficar minúsculo
                ctx.scale(dpr, dpr);
            };

            // Escuta as mudanças (ex: girar o celular ou esconder a barra de endereço)
            window.addEventListener('resize', resizeCanvas);
            
            // Chama imediatamente para configurar a resolução inicial
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
