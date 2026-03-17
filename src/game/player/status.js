export function updateStatusEffects(player, dt) {
    if (!player.activeEffects) return;
    for (let i = player.activeEffects.length - 1; i >= 0; i--) {
        const effect = player.activeEffects[i];
        effect.duration -= dt;
        if (effect.duration <= 0) {
            player.stats.removeModifier(effect.stat, effect.id);
            player.activeEffects.splice(i, 1);
            console.log(`✨ Efeito expirado: ${effect.id}`);
        }
    }
}
export class StatSheet {
    constructor(baseStats) {
        this.base = { ...baseStats };
        this.modifiers = [];
    }
    get(stat) {
        if (this.base[stat] === undefined) return 0;
        let value = this.base[stat];
        const mods = this.modifiers.filter(m => m.stat === stat);
        mods.filter(m => m.type === 'add').forEach(m => value += m.value);
        mods.filter(m => m.type === 'multiply').forEach(m => value *= m.value);
        return value;
    }
    addModifier(stat, id, value, type = 'multiply') {
        this.removeModifier(stat, id);
        this.modifiers.push({ stat, id, value, type });
    }
    removeModifier(stat, id) {
        this.modifiers = this.modifiers.filter(m => !(m.stat === stat && m.id === id));
    }
    getPreview(stat, newModifier) {
        const current = this.get(stat);
        const tempModifiers = [...this.modifiers, { ...newModifier, stat }];
        let out = this.base[stat];
        tempModifiers
            .filter(m => m.stat === stat && m.type === 'add')
            .forEach(m => out += m.value);
        tempModifiers
            .filter(m => m.stat === stat && m.type === 'multiply')
            .forEach(m => out *= m.value);
        return {
            before: current,
            after: out,
            diff: out - current
        };
    }
}
