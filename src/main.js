// 1. Importações com caminhos relativos corrigidos (já estamos dentro da pasta 'src')
import { loadAllConfigs } from './config/configManager.js';
import { initEnemyTypes } from './entities/enemy/types/typeLoader.js';
import { initUpgrades } from './game/upgrades/upgradeLoader.js';
import { startGameLoop } from './game/gameLoop.js';

/**
 * FUNÇÃO DE BOOT (A inicialização do Motor)
 * Prepara o terreno antes de liberar o loop do jogo.
 */
async function bootstrap() {
    try {
        console.group("🚀 Iniciando Boot do Jogo");
        
        // 1. Configura o Canvas globalmente
        const canvas = document.getElementById('game');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Atualiza o tamanho se o jogador redimensionar a janela
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        } else {
            console.warn("⚠️ Canvas com ID 'game' não encontrado no HTML!");
        }

        console.log("📦 Carregando Configurações, Inimigos e Upgrades...");

        // 2. Carrega todos os módulos e dados em paralelo (Alta Performance)
        // O jogo SÓ avança para a próxima linha quando tudo isso terminar
        await Promise.all([
            loadAllConfigs(),
            initEnemyTypes(),
            initUpgrades()
        ]);

        console.log("✅ Boot concluído com sucesso!");
        console.groupEnd();

        // 3. Passa o controle total para o Game Loop
        startGameLoop();

    } catch (err) {
        console.error("❌ Falha Crítica no Boot:", err);
        console.groupEnd();
    }
}

// 🚀 DISPARA O MOTOR DO JOGO
bootstrap();
