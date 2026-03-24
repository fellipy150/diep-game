import { UpgradeSystem } from '../upgrades/index.js';
import { showLevelUpMenu } from '../ui/LevelUpMenu.js';

// 🎯 CORREÇÃO 1: Respeitando o recado dos devs e importando direto do index!
import { SynergyEngine } from '../synergies/index.js';

// 🗑️ CORREÇÃO 2: Removido o import do showSynergyToast que não era usado (ESLint agradece).

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

export function handleProgress(player, gameState) {
    gameState.isPaused = true;
    const choices = UpgradeSystem.getChoices(player, 4);
    
    showLevelUpMenu(player, choices, (selectedId) => {
        applyUpgrade(player, selectedId);
        gameState.isPaused = false;
    });
}

export function applyUpgrade(player, upgradeId) {
    UpgradeSystem.apply(player, upgradeId);
    console.log(`💪 Upgrade aplicado: ${upgradeId}`);
    
    if (SynergyEngine && typeof SynergyEngine.evaluate === 'function') {
        SynergyEngine.evaluate(player, UpgradeSystem);
    }
    
    return true;
}

