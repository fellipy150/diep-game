export let gameData = null;

export async function loadAllConfigs() {
    const files = [
        'config_bullets.json',
        'config_upgrades.json',
        'config_enemies.json',
        'config_synergies.json'
    ];
    
    try {
        const results = await Promise.all(
            files.map(file => fetch(`./js/${file}`).then(r => r.json()))
        );
        
        gameData = {
            bullets: results[0],
            upgrades: results[1],
            enemies: results[2],
            synergies: results[3]
        };
        return gameData;
    } catch (err) {
        console.error("Failed to load JSON configs:", err);
    }
}

