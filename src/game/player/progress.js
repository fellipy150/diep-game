import { UpgradeSystem } from '../upgrades/index.js';
import { SynergyEngine } from '../synergies/index.js';
import { showLevelUpMenu } from '../ui/LevelUpMenu.js'; // Importação descomentada

/**
 * Adiciona experiência ao jogador e verifica se ele subiu de nível.
 */
export function gainXp(player, amount, gameState) {
    player.xp += amount;
    
    // Verifica se atingiu o XP necessário para o próximo nível
    if (player.xp >= player.xpNeeded) {
        player.level++;
        player.xp -= player.xpNeeded;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.2); // Aumenta a dificuldade do próximo nível
        
        console.log(`🎉 Level Up! Nível ${player.level}`);

        // Se o gameState for passado, pausamos o jogo e abrimos o menu
        if (gameState) {
            gameState.isPaused = true;
            
            // Busca 4 opções curadas com pesos (Fase 4)
            const choices = UpgradeSystem.getChoices(player, 4);
            
            // Aciona a interface de escolha e aguarda o callback
            showLevelUpMenu(player, choices, (selectedId) => {
                applyUpgrade(player, selectedId);
                gameState.isPaused = false; // Retoma o jogo após a escolha
            });
        }
    }
}

/**
 * Aplica um upgrade ao jogador e recalcula as sinergias.
 */
export function applyUpgrade(player, upgradeId) {
    // 1. O UpgradeSystem injeta os modificadores no StatSheet do Player
    UpgradeSystem.apply(player, upgradeId);
    
    console.log(`💪 Upgrade aplicado: ${upgradeId}`);

    // 2. O Motor de Sinergia verifica se uma nova combinação foi formada
    if (SynergyEngine && typeof SynergyEngine.evaluate === 'function') {
        SynergyEngine.evaluate(player);
    }
    
    return true;
}
