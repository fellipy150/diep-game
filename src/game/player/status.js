/**
 * Gerenciador de Atributos (StatSheet)
 * Centraliza o cálculo de atributos, permitindo bônus e penalidades temporárias.
 */
export class StatSheet {
    constructor(baseStats) {
        // Valores nativos (ex: { speed: 1.0, damage: 40 })
        this.base = { ...baseStats };
        // Lista de modificadores ativos
        this.modifiers = [];
    }

    /**
     * Retorna o valor final de um atributo após todos os cálculos.
     */
    get(stat) {
        if (this.base[stat] === undefined) return 0;

        let value = this.base[stat];
        const mods = this.modifiers.filter(m => m.stat === stat);

        // 1. Aplica Somas (Additive)
        mods.filter(m => m.type === 'add').forEach(m => value += m.value);

        // 2. Aplica Multiplicações (Multiplicative)
        mods.filter(m => m.type === 'multiply').forEach(m => value *= m.value);

        return value;
    }

    /**
     * Registra um novo modificador (vindo de upgrades ou status effects)
     */
    addModifier(stat, id, value, type = 'multiply') {
        // Evita duplicatas do mesmo ID (ex: não acumular duas colas iguais)
        this.removeModifier(stat, id);
        
        this.modifiers.push({ stat, id, value, type });
    }

    /**
     * Remove um modificador específico
     */
    removeModifier(stat, id) {
        this.modifiers = this.modifiers.filter(m => !(m.stat === stat && m.id === id));
    }

    /**
     * 🚀 INSTRUÇÃO APLICADA: getPreview
     * Simula a aplicação de um modificador para exibir na UI antes do jogador escolher.
     */
    getPreview(stat, newModifier) {
        // Pega o valor real atual
        const current = this.get(stat);

        // Simulação rápida: clona os modificadores atuais e injeta o novo
        const tempModifiers = [...this.modifiers, { ...newModifier, stat }];
        
        let out = this.base[stat];

        // Recalcula seguindo a ordem (Soma -> Multiplicação)
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
