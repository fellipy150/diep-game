export class Input {
    constructor() {
        this.move = { x: 0, y: 0 };
        this.aim = { x: 0, y: 0 };
        this.isShooting = false;
        this.joyMove = document.getElementById('joystick-move');
        this.stickMove = document.getElementById('stick-move');
        this.joyAim = document.getElementById('joystick-aim');
        this.stickAim = document.getElementById('stick-aim');
        this.moveTouchId = null;
        this.aimTouchId = null;
        this.maxRadius = 40;
        if (this.joyMove && this.joyAim) {
            this.initEvents();
        } else {
            console.warn("Joysticks não encontrados no DOM. Verifique seu index.html.");
        }
    }
    initEvents() {
        const handlePrevention = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                if (e.cancelable) e.preventDefault();
            }
        };
        document.addEventListener('touchstart', handlePrevention, { passive: false });
        document.addEventListener('touchmove', handlePrevention, { passive: false });
        this.setupJoystick(this.joyMove, this.stickMove, 'move');
        this.setupJoystick(this.joyAim, this.stickAim, 'aim');
    }
    setupJoystick(baseEl, stickEl, type) {
        if (!baseEl || !stickEl) return;
        baseEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = baseEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (type === 'move' && this.moveTouchId === null) {
                    this.moveTouchId = touch.identifier;
                    this.updateJoystick(touch, centerX, centerY, stickEl, type);
                } else if (type === 'aim' && this.aimTouchId === null) {
                    this.aimTouchId = touch.identifier;
                    this.isShooting = true;
                    this.updateJoystick(touch, centerX, centerY, stickEl, type);
                }
            }
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.moveTouchId) {
                    const rect = this.joyMove.getBoundingClientRect();
                    this.updateJoystick(touch, rect.left + rect.width / 2, rect.top + rect.height / 2, this.stickMove, 'move');
                } else if (touch.identifier === this.aimTouchId) {
                    const rect = this.joyAim.getBoundingClientRect();
                    this.updateJoystick(touch, rect.left + rect.width / 2, rect.top + rect.height / 2, this.stickAim, 'aim');
                }
            }
        }, { passive: false });
        const handleEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.resetJoystick(this.stickMove, 'move');
                } else if (touch.identifier === this.aimTouchId) {
                    this.aimTouchId = null;
                    this.isShooting = false;
                    this.resetJoystick(this.stickAim, 'aim');
                }
            }
        };
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }
    updateJoystick(touch, centerX, centerY, stickEl, type) {
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const dirX = dist === 0 ? 0 : dx / dist;
        const dirY = dist === 0 ? 0 : dy / dist;
        const visualDist = Math.min(dist, this.maxRadius);
        stickEl.style.transform = `translate(${dirX * visualDist}px, ${dirY * visualDist}px)`;
        if (type === 'move') {
            const force = Math.min(dist / this.maxRadius, 1);
            this.move.x = dirX * force;
            this.move.y = dirY * force;
        } else if (type === 'aim') {
            this.aim.x = dirX;
            this.aim.y = dirY;
        }
    }
    resetJoystick(stickEl, type) {
        if (!stickEl) return;
        stickEl.style.transform = `translate(0px, 0px)`;
        if (type === 'move') {
            this.move.x = 0;
            this.move.y = 0;
        } else if (type === 'aim') {
            this.aim.x = 0;
            this.aim.y = 0;
        }
    }
}
export const input = new Input();
