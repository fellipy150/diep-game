const modules = import.meta.glob('./types/*.js', { eager: true });
const registry = [];
export async function initUpgrades() {
    registry.length = 0;
    for (const path in modules) {
        const module = modules[path];
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
export const getAllUpgrades = () => registry;
