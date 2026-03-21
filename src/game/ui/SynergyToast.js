export const SynergyEngine = {
    evaluate(player, registry) {
        registry.forEach(synergy => {
            const meetsRequirements = synergy.check(player);
            if (meetsRequirements) {
                if (!player.activeSynergies.has(synergy.id)) {
                    this.activateSynergy(player, synergy);
                }
            } else {
                if (player.activeSynergies.has(synergy.id)) {
                    player.activeSynergies.delete(synergy.id);
                }
            }
        });
    },
    activateSynergy(player, synergy) {
        player.activeSynergies.add(synergy.id);
        showSynergyToast(synergy);
        if (synergy.onActivate) synergy.onActivate(player);
    }
};
export function showSynergyToast(synergy) {
    const toast = document.createElement('div');
    const bgColor = synergy.color || 'rgba(138, 43, 226, 0.9)';
    const borderColor = synergy.borderColor || '#a29bfe';
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        backgroundColor: bgColor,
        color: 'white',
        padding: '20px 40px',
        borderRadius: '8px',
        border: `2px solid ${borderColor}`,
        textAlign: 'center',
        fontFamily: 'sans-serif',
        zIndex: '1000',
        opacity: '0',
        boxShadow: `0 0 20px ${borderColor}44`,
        pointerEvents: 'none',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    toast.innerHTML = `
        <h2 style="margin:0; font-size: 18px; color:#ffeaa7; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">✨ SINERGIA ATIVADA ✨</h2>
        <h3 style="margin:5px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">${synergy.name}</h3>
        <p style="margin:0; font-size:14px; opacity:0.9; font-style: italic;">${synergy.description}</p>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-50px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
