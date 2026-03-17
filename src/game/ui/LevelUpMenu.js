import { getSynergyHint } from '../synergies/index.js';
export function showLevelUpMenu(player, choices, onSelect) {
    const overlay = document.createElement('div');
    overlay.id = 'level-up-overlay';
    applyStyles(overlay, {
        position: 'fixed',
        top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '2000',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    });
    const title = document.createElement('h1');
    title.innerText = "NÍVEL CONCLUÍDO - ESCOLHA UM UPGRADE";
    applyStyles(title, { color: '#fff', marginBottom: '30px', letterSpacing: '2px' });
    overlay.appendChild(title);
    const cardsContainer = document.createElement('div');
    applyStyles(cardsContainer, {
        display: 'flex',
        gap: '20px',
        perspective: '1000px'
    });
    choices.forEach(up => {
        const card = document.createElement('div');
        card.className = `upgrade-card ${up.rarity}`;
        const rarityColors = {
            common: '#95a5a6',
            uncommon: '#2ecc71',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f1c40f'
        };
        let previewHtml = "";
        if (up.modifier) {
            const { before, after } = player.stats.getPreview(up.modifier.stat, up.modifier);
            previewHtml = `
                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <span style="font-size: 12px; color: #bdc3c7;">${up.modifier.stat.toUpperCase()}</span><br>
                    <b style="color: #ff7675;">${before.toFixed(1)}</b>
                    <span style="color: #fff;">➔</span>
                    <b style="color: #55efc4;">${after.toFixed(1)}</b>
                </div>`;
        }
        const hint = getSynergyHint(player, up);
        const hintHtml = hint ?
            `<div style="color: #fdcb6e; font-size: 11px; margin-top: 5px; font-weight: bold;">
                ✨ PEÇA PARA: ${hint.name.toUpperCase()}
             </div>` : "";
        card.innerHTML = `
            <div class="rarity-tag" style="background: ${rarityColors[up.rarity]}; color: #000; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 10px; display: inline-block;">
                ${up.rarity.toUpperCase()}
            </div>
            <h3 style="margin: 10px 0; color: #fff;">${up.name}</h3>
            <p style="font-size: 13px; color: #ecf0f1; line-height: 1.4;">${up.description}</p>
            ${previewHtml}
            ${hintHtml}
        `;
        applyStyles(card, {
            width: '220px',
            minHeight: '280px',
            backgroundColor: '#2d3436',
            border: `2px solid ${rarityColors[up.rarity]}`,
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column'
        });
        card.onmouseover = () => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
            card.style.boxShadow = `0 10px 20px ${rarityColors[up.rarity]}44`;
        };
        card.onmouseout = () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
        };
        card.onclick = () => {
            overlay.remove();
            onSelect(up.id);
        };
        cardsContainer.appendChild(card);
    });
    overlay.appendChild(cardsContainer);
    document.body.appendChild(overlay);
}
function applyStyles(element, styles) {
    Object.assign(element.style, styles);
}
