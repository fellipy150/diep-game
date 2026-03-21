export const DebugInfo = {
    active: false,
    lastTime: performance.now(),
    frames: 0,
    fps: 0,
    frameTime: 0,
    update(dt) {
        if (!this.active) return;
        this.frames++;
        const now = performance.now();
        this.frameTime = dt * 1000;
        if (now - this.lastTime >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastTime = now;
        }
    },
    draw(ctx, gameState) {
        if (!this.active) return;
        const { player, enemies } = gameState;
        let totalBullets = player?.bullets?.length || 0;
        if (enemies) {
            enemies.forEach(e => {
                if (e.bullets) totalBullets += e.bullets.length;
            });
        }
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        const x = window.innerWidth - 160;
        const y = 10;
        ctx.fillRect(x, y, 150, 100);
        ctx.strokeRect(x, y, 150, 100);
        // Textos estilo "Hacker/Dev"
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.fps}`, x + 10, y + 20);
        ctx.fillText(`Frame Time: ${this.frameTime.toFixed(1)}ms`, x + 10, y + 40);
        ctx.fillText(`Inimigos: ${enemies?.length || 0}`, x + 10, y + 60);
        ctx.fillText(`Balas Ativas: ${totalBullets}`, x + 10, y + 80);
        ctx.restore();
    },
    // Função para ligar/desligar
    toggle() {
        this.active = !this.active;
        console.log(`Debug Mode: ${this.active ? 'ON' : 'OFF'}`);
    }
};
