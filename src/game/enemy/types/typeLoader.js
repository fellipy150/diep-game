const modules = import.meta.glob('./*.js', { eager: true });
const enemyRegistry = {};
export async function initEnemyTypes() {
    console.log("🔍 Vasculhando arquivos de inimigos...");
    for (const path in modules) {
        if (path.includes('typeLoader.js') || path.includes('index.js')) continue;
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
