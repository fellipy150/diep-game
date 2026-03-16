/**
 * Adiciona um efeito de status ao player.
 * Se o efeito for novo, registra um modificador no StatSheet.
 */
export function addStatusEffect(player, type, duration) {
    let existing = player.activeEffects.find(e => e.type === type);
    
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
    } else {
        player.activeEffects.push({ type, duration });

        // Lógica de Modificadores do StatSheet
        // O ID (ex: 'status_glue') garante que o efeito não acumule infinitamente com ele mesmo
        if (type === 'glue') {
            player.stats.addModifier('speed', 'status_glue', 0.3, 'multiply');
            console.log("🕸️ Player foi grudado! Velocidade reduzida.");
        }
    }
}

/**
 * Atualiza as durações e limpa modificadores expirados.
 */
export function updateStatusEffects(player, dt) {
    for (let i = player.activeEffects.length - 1; i >= 0; i--) {
        let effect = player.activeEffects[i];
        effect.duration -= dt;

        if (effect.duration <= 0) {
            // Limpa o modificador do StatSheet ao encerrar o efeito
            if (effect.type === 'glue') {
                player.stats.removeModifier('speed', 'status_glue');
                console.log("✨ Efeito de cola dissipado.");
            }
            
            player.activeEffects.splice(i, 1);
        }
    }
}
