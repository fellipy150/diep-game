// src/game/upgrades/upgradeLoader.js

// O Vite varre a pasta e já traz os módulos carregados
const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];

/**
 * Inicializa o registro de upgrades. 
 * Deve ser chamado e esperado (await) no bootstrap do main.js
 */
export async function initUpgrades() {
    // Limpa o array para evitar duplicatas se o Vite recarregar (HMR)
    registry.length = 0; 

    for (const path in modules) {
        const module = modules[path];
        // Pega a exportação nomeada (ex: export const maxHpUpgrade) ou a padrão
        const data = module.default || Object.values(module)[0];
        
        if (data && data.id) {
            registry.push(data);
            console.log(`✨ Upgrade registrado: [${data.id}]`);
        }
    }

    if (registry.length === 0) {
        console.error("⚠️ Nenhum upgrade foi encontrado na pasta types/!");
    } else {
        console.log(`✅ Sistema de Progressão pronto: ${registry.length} itens.`);
    }
}

/**
 * Retorna todos os upgrades carregados
 */
export const getAllUpgrades = () => registry;
