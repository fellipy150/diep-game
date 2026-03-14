// 1. O Vite encontra todos os arquivos .js nesta pasta
const modules = import.meta.glob('./*.js');

// 2. CORREÇÃO: O registro precisa estar aqui fora, no escopo global do arquivo
const enemyRegistry = {};

/**
 * Inicializa o carregamento dos DNAs
 */
export async function initEnemyTypes() {
    const loadPromises = [];

    console.log("🔍 Vasculhando arquivos de inimigos...");

    for (const path in modules) {
        // Ignora o próprio carregador e o index para não entrar em loop
        if (path.includes('typeLoader.js') || path.includes('index.js')) continue;

        const promise = modules[path]().then(module => {
            // Limpa o nome do arquivo para usar como chave (ex: './cannon-fodder.js' -> 'cannon-fodder')
            const fileName = path.split('/').pop().replace('.js', '');
            const typeName = fileName.toLowerCase();

            // Pega a primeira exportação do arquivo (ex: export const CannonFodder = ...)
            const exportKey = Object.keys(module)[0];
            
            if (exportKey) {
                // Salva no registro global do arquivo
                enemyRegistry[typeName] = module[exportKey];
                console.log(`✅ Inimigo registrado: [${typeName}]`);
            }
        });

        loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    
    const count = Object.keys(enemyRegistry).length;
    console.log(`🎮 Sistema de Tipos pronto! ${count} inimigos carregados.`);
}

/**
 * Busca o DNA do inimigo pelo nome (usado pelo Spawner e Enemy)
 */
export const getType = (name) => {
    const key = name?.toLowerCase();
    return enemyRegistry[key] || null;
};

/**
 * Retorna todos os nomes registrados (usado pelo Spawner)
 */
export const getAllAvailableTypes = () => Object.keys(enemyRegistry);
