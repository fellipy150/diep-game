// src/config/configManager.js

// 1. Exportamos um objeto constante. 
// A referência na memória nunca muda, garantindo que a Fonte Única de Verdade seja segura.
export const gameData = {};

export async function loadAllConfigs() {
    // 2. Os arquivos agora estão na nova pasta de dados
    const files = [
        'config_bullets.json',
        'config_upgrades.json',
        'config_enemies.json',
        'config_synergies.json'
    ];
    
    try {
        const results = await Promise.all(
            files.map(file => fetch(`./src/config/data/${file}`).then(r => {
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status} no arquivo ${file}`);
                return r.json();
            }))
        );
        
        // 3. Injetamos os dados no objeto exportado em vez de sobrescrever a variável
        Object.assign(gameData, {
            bullets: results[0],
            upgrades: results[1],
            enemies: results[2],
            synergies: results[3]
        });

        return gameData;
    } catch (err) {
        // 4. Propagamos o erro para que o main.js saiba que a inicialização falhou
        console.error("Failed to load JSON configs:", err);
        throw err; 
    }
}
