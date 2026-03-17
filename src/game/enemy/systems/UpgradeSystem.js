/**
 * Tabela de Pesos por Estratégia
 * Define a probabilidade (0-100) de cada atributo ser escolhido no level up.
 */
const STRATEGIES = {
    balanced: { maxHp: 25, damage: 25, speed: 25, fireRate: 25 },
    tank:     { maxHp: 60, damage: 20, speed: 10, fireRate: 10 },
    assassin: { maxHp: 10, damage: 40, speed: 30, fireRate: 20 },
    sniper:   { maxHp: 10, damage: 30, speed: 10, fireRate: 50 }
};

/**
 * Valores de bônus por "ponto" de evolução
 */
const BUFF_VALUES = {
    maxHp: { type: 'add', value: 20 },
    damage: { type: 'add', value: 5 },
    speed: { type: 'multiply', value: 1.05 },    // +5%
    fireRate: { type: 'multiply', value: 0.95 }  // -5% (atira mais rápido)
};

export const UpgradeSystem = {
    /**
     * Evolui um inimigo baseado no nível dele.
     * @param {Object} enemy - Instância do inimigo (deve possuir a classe StatSheet).
     * @param {number} level - Nível pretendido.
     */
    evolve: (enemy, level) => {
        if (level <= 1) return;

        // 1. Determina a estratégia (se não tiver no DNA, usa balanced)
        const strategyName = enemy.type?.stats?.upgradeStrategy || 'balanced';
        const weights = STRATEGIES[strategyName] || STRATEGIES.balanced;

        // 2. Aplica "pontos de talento" para cada nível acima do 1
        for (let i = 1; i < level; i++) {
            const statToUpgrade = chooseWeightedStat(weights);
            applyStatChange(enemy, statToUpgrade);
        }

        // 3. Sincroniza o HP atual com o novo MaxHp após a evolução
        enemy.hp = enemy.stats.get('maxHp');
    }
};

/**
 * Sorteia um atributo baseado nos pesos da estratégia
 */
function chooseWeightedStat(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [stat, weight] of Object.entries(weights)) {
        if (random < weight) return stat;
        random -= weight;
    }
    return 'maxHp'; // Fallback
}

/**
 * Aplica o bônus diretamente no StatSheet do inimigo
 */
function applyStatChange(enemy, stat) {
    const config = BUFF_VALUES[stat];
    if (!config || !enemy.stats) return;

    // Usamos o ID 'evolution' para que bônus de níveis diferentes se somem
    // Nota: Para somar modificadores do mesmo ID, precisamos que o StatSheet suporte 
    // ou usamos um ID único por nível (ex: `evolution_${stat}_${Math.random()}`)
    enemy.stats.addModifier(
        stat, 
        `evo_${stat}_${Math.random().toString(36).substr(2, 5)}`, 
        config.value, 
        config.type
    );
}
