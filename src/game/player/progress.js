import { UpgradeSystem } from '../upgrades/index.js';
import { SynergyEngine } from '../synergies/index.js';
import { showLevelUpMenu } from '../ui/LevelUpMenu.js';

/**
 * Adiciona experiência ao jogador e processa o Level Up no modelo de eventos.
 */
export function gainXp(player, amount) {
    player.xp += amount;
    
    if (player.xp >= player.xpNeeded) {
        player.level++;
        player.xp -= player.xpNeeded;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.2);
        
        console.log(`🎉 Level Up! Nível ${player.level}`);
        

        if (player.onLevelUp) player.onLevelUp();
    }
}

/**
 * Lida com o estado do jogo durante a progressão (pausa e menu).
 * Geralmente chamado como reação ao evento onLevelUp do jogador.
 */
export function handleProgress(player, gameState) {
    gameState.isPaused = true;
    const choices = UpgradeSystem.getChoices(player, 4);
    
       showLevelUpMenu(player, choices, (selectedId) => {
        applyUpgrade(player, selectedId);
        gameState.isPaused = false;
    });
}

/**
 * Aplica um upgrade ao jogador e recalcula as sinergias.
 */
export function applyUpgrade(player, upgradeId) {
    UpgradeSystem.apply(player, upgradeId);
    console.log(`💪 Upgrade aplicado: ${upgradeId}`);
    
    // Atualizado para passar o UpgradeSystem junto com o player
    if (SynergyEngine && typeof SynergyEngine.evaluate === 'function') {
        SynergyEngine.evaluate(player, UpgradeSystem);
    }
    
    return true;
}
