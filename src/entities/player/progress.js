import { gameData } from "../../config/configManager.js";
import { getSpecialBulletsPool } from "../projectiles/index.js";
// import { UpgradeRegistry } from "../../core/upgrades.js";

export function gainXp(player, amt) {
    player.xp += amt;
    while (player.xp >= player.xpNeeded) {
        levelUp(player);
    }
}

function levelUp(player) {
    player.level++;
    player.xp -= player.xpNeeded;
    player.xpNeeded = Math.floor(player.xpNeeded * 1.25);

    let choices = [];
    const baseUpgrades = gameData.upgrades.statUpgrades;
    let shuffledBase = [...baseUpgrades].sort(() => 0.5 - Math.random());

    if (Math.random() <= 0.25) {
        const pool = getSpecialBulletsPool();
        if (pool.length > 0) {
            let randomSpecial = pool[Math.floor(Math.random() * pool.length)];
            choices.push({
                id: 'bullet_' + randomSpecial,
                name: 'Ammo: ' + randomSpecial.toUpperCase(),
                description: 'Changes your primary weapon to ' + randomSpecial.toUpperCase(),
                type: 'weapon'
            });
            choices.push(...shuffledBase.slice(0, 3));
        } else {
            choices.push(...shuffledBase.slice(0, 4));
        }
    } else {
        choices.push(...shuffledBase.slice(0, 4));
    }

    if (player.onLevelUp) player.onLevelUp(choices);
}

export function applyUpgrade(player, upgradeId) {
    const upgrade = UpgradeRegistry.getById(upgradeId);
    
    if (upgrade) {
        const currentStacks = player.upgradeCounts[upgradeId] || 0;
        if (upgrade.maxStacks && currentStacks >= upgrade.maxStacks) {
            console.warn(`⚠️ Upgrade ${upgrade.name} já está no nível máximo!`);
            return false;
        }

        upgrade.apply(player);
        player.upgradeCounts[upgradeId] = currentStacks + 1;

        if (upgrade.onUnlock) upgrade.onUnlock(player);
        checkSynergies(player);
        
        return true;
    }
    return false;
}

export function checkSynergies(player) {
    gameData.synergies.synergies.forEach(syn => {
        if (!player.activeSynergies.includes(syn.id) && player.currentBulletType === syn.requiredBullet) {
            const metRequirements = Object.keys(syn.requiredUpgrades).every(reqId =>
                (player.upgradeCounts[reqId] || 0) >= syn.requiredUpgrades[reqId]
            );
            if (metRequirements) {
                player.activeSynergies.push(syn.id);
                console.log("%c SYNERGY UNLOCKED: " + syn.name, "color: #ff0; font-weight: bold; font-size: 14px;");
            }
        }
    });
}
