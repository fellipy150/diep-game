// Exemplo de como montar os dados do Card
choices.forEach(up => {
    // 1. Preview de Stat
    let previewHtml = "";
    if (up.modifier) {
        const { before, after } = player.stats.getPreview(up.modifier.stat, up.modifier);
        previewHtml = `<div class="stat-preview">${up.modifier.stat}: ${before.toFixed(1)} ➔ ${after.toFixed(1)}</div>`;
    }

    // 2. Indicador de Sinergia
    const hint = getSynergyHint(player, up);
    const hintHtml = hint ? `<div class="synergy-hint">Próximo de: ${hint.name}</div>` : "";

    // 3. Renderizar Card
    card.innerHTML = `
        <div class="card ${up.rarity}">
            <span class="rarity-tag">${up.rarity.toUpperCase()}</span>
            <h3>${up.name}</h3>
            ${previewHtml}
            ${hintHtml}
            <p>${up.description}</p>
        </div>
    `;
});
