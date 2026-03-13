// Importação dos tipos (seus arquivos de Config + Brain unificados)
import { Kamikaze } from './Kamikaze.js';
import { Sniper } from './Sniper.js';
import { Grunt } from './Grunt.js'; // Inimigo padrão/base

// O Registro (Dicionário de tipos)
const enemyRegistry = {
    kamikaze: Kamikaze,
    sniper: Sniper,
    grunt: Grunt
};

/**
 * Retorna o objeto de tipo (stats + think) baseado no nome.
 * @param {string} typeName 
 * @returns {Object} O Maestro do inimigo
 */
export const getType = (typeName) => {
    // Normaliza para letras minúsculas para evitar erros de case-sensitive
    const name = typeName?.toLowerCase();
    
    if (enemyRegistry[name]) {
        return enemyRegistry[name];
    }

    // Fallback de segurança para não quebrar o jogo se o nome estiver errado
    console.warn(`Enemy type "${typeName}" not found. Using "grunt" as fallback.`);
    return enemyRegistry.grunt;
};

/**
 * Retorna uma lista de todos os tipos disponíveis (útil para o spawn aleatório)
 */
export const getAllAvailableTypes = () => Object.keys(enemyRegistry);
