import { UpgradeSystem } from '../upgrades/index.js';
import { SynergyEngine } from '../synergy/index.js';

/**
 * Gerencia o progresso do jogador: ganho de XP, level up e exibição do menu de upgrades.
 * 
 * @param {Object} player - Instância do jogador.
 * @param {Object} gameState - Estado global do jogo (usado para pausar).
 */
export function handleProgress(player, gameState) {
    if (player.xp >= player.nextLevelXp) {
        // Sobe de nível
        player.level++;
        player.xp -= player.nextLevelXp;
        player.nextLevelXp = Math.floor(player.nextLevelXp * 1.2); // Escalonamento de XP

        // Pausa o jogo para escolha do upgrade
        gameState.isPaused = true;

        // Obtém opções de upgrade baseadas no pool ponderado
        const choices = UpgradeSystem.getChoices(player, 4);

        // Exibe o menu de level up com as opções
        showLevelUpMenu(choices, (selectedId) => {
            // Aplica o upgrade escolhido
            UpgradeSystem.apply(player, selectedId);
            
            // Reavalia sinergias após o upgrade
            SynergyEngine.evaluate(player);
            
            // Retoma o jogo
            gameState.isPaused = false;
        });
    }
}

/**
 * Função auxiliar para ganho de XP (pode ser chamada ao matar inimigos, etc.)
 * 
 * @param {Object} player - Instância do jogador.
 * @param {number} amt - Quantidade de XP a adicionar.
 * @param {Object} gameState - Estado global do jogo.
 */
export function gainXp(player, amt, gameState) {
    player.xp += amt;
    handleProgress(player, gameState);
}

// Nota: As funções applyUpgrade e checkSynergies foram removidas,
// pois agora são delegadas ao UpgradeSystem e SynergyEngine.0
