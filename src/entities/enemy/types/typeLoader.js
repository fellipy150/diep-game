// O eager: true já traz os módulos prontos
const modules = import.meta.glob('./*.js', { eager: true });

// O Cofre Global de DNAs
const enemyRegistry = {};

export async function initEnemyTypes() {
    console.log("🔍 Vasculhando arquivos de inimigos...");

    for (const path in modules) {
        // Ignora o loader e o index
        if (path.includes('typeLoader.js') || path.includes('index.js')) continue;

        // CORREÇÃO: modules[path] já é o módulo, não precisa de () ou .then()
        const module = modules[path]; 

        const fileName = path.split('/').pop().replace('.js', '');
        const typeName = fileName.toLowerCase();
        const exportKey = Object.keys(module)[0];

        if (exportKey) {
            enemyRegistry[typeName] = module[exportKey];
            console.log(`✅ Inimigo registrado: [${typeName}]`);
        }
    }

    const count = Object.keys(enemyRegistry).length;
    console.log(`🎮 Sistema de Tipos pronto! ${count} inimigos carregados.`);
}

export const getType = (name) => {
    const key = name?.toLowerCase();
    return enemyRegistry[key] || null;
};

export const getAllAvailableTypes = () => Object.keys(enemyRegistry);
