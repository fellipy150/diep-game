export function showSynergyToast(synergy) {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        backgroundColor: 'rgba(138, 43, 226, 0.9)',
        color: 'white',
        padding: '20px 40px',
        borderRadius: '8px',
        border: '2px solid #a29bfe',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        zIndex: '1000',
        opacity: '0',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    toast.innerHTML = `
        <h2 style="margin:0; color:#ffeaa7;">✨ SINERGIA ATIVADA ✨</h2>
        <h3 style="margin:5px 0;">${synergy.name}</h3>
        <p style="margin:0; font-size:14px; opacity:0.8;">${synergy.description}</p>
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
