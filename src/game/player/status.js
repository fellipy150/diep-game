export function addStatusEffect(player, type, duration) {
    let existing = player.activeEffects.find(e => e.type === type);
    if (existing) {
        // Renova o tempo se o efeito já existir
        existing.duration = Math.max(existing.duration, duration);
    } else {
        // Adiciona novo efeito
        player.activeEffects.push({ type, duration });
    }
}

export function updateStatusEffects(player, dt) {
    // Reseta o multiplicador a cada frame antes de recalcular
    player.currentSpeedMult = 1.0;
    
    for (let i = player.activeEffects.length - 1; i >= 0; i--) {
        let effect = player.activeEffects[i];
        effect.duration -= dt;
        
        // Aplica as lógicas específicas de cada efeito
        if (effect.type === 'glue') {
            player.currentSpeedMult *= 0.3;
        }
        
        // Remove se o tempo acabou
        if (effect.duration <= 0) {
            player.activeEffects.splice(i, 1);
        }
    }
}
