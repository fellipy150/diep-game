export class Input {
    constructor() {
        this.move = { x: 0, y: 0 };
        this.aim = { x: 0, y: 0 };
        this.lastAim = { x: 1, y: 0 };
        this.isShooting = false;
        this.isAiming = false;
        this.isManualAiming = false;
        this.fireReleased = false;
        this.isTap = false;
        this.joyMove = document.getElementById('joystick-move');
        this.stickMove = document.getElementById('stick-move');
        this.joyAim = document.getElementById('joystick-aim');
        this.stickAim = document.getElementById('stick-aim');
        this.joyData = {
            move: { base: this.joyMove, stick: this.stickMove, id: null, ox: 0, oy: 0, cx: 0, cy: 0 },
            aim: { base: this.joyAim, stick: this.stickAim, id: null, ox: 0, oy: 0, cx: 0, cy: 0 }
        };
        this.maxRadius = 40;
        this.aimTimer = null;
        this.feedbackTimer = null;
        if (this.joyMove && this.joyAim) this.initEvents();
    }
    initEvents() {
        const handlePrevention = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                if (e.cancelable) e.preventDefault();
            }
        };
        document.addEventListener('touchstart', handlePrevention, { passive: false });
        document.addEventListener('touchmove', handlePrevention, { passive: false });
        requestAnimationFrame(() => this.saveOriginalPositions());
        this.setupJoystick('move');
        this.setupJoystick('aim');
    }
    saveOriginalPositions() {
        ['move', 'aim'].forEach(type => {
            const data = this.joyData[type];
            if (!data.base) return;
            const rect = data.base.getBoundingClientRect();
            data.ox = rect.left + rect.width / 2;
            data.oy = rect.top + rect.height / 2;
            data.cx = data.ox;
            data.cy = data.oy;
        });
    }
    setupJoystick(type) {
        const data = this.joyData[type];
        if (!data.base || !data.stick) return;
        data.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (data.id === null) {
                    data.id = touch.identifier;
                    data.cx = touch.clientX;
                    data.cy = touch.clientY;
                    this.updateBaseVisual(type);
                    if (type === 'aim') {
                        this.aimStartTime = Date.now();
                        this.aimStartPos = { x: touch.clientX, y: touch.clientY };
                        this.isManualAiming = false;
                        clearTimeout(this.aimTimer);
                        this.aimTimer = setTimeout(() => {
                            this.isManualAiming = true;
                            this.isAiming = true;
                        }, 500);
                    }
                    this.updateJoystick(touch, type);
                }
            }
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === data.id) {
                    if (type === 'aim') {
                        const distMoved = Math.hypot(touch.clientX - this.aimStartPos.x, touch.clientY - this.aimStartPos.y);
                        if (distMoved > 10) {
                            clearTimeout(this.aimTimer);
                            this.isManualAiming = true;
                            this.isAiming = true;
                        }
                    }
                    this.updateJoystick(touch, type);
                }
            }
        }, { passive: false });
        const handleEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === data.id) {
                    data.id = null;
                    if (type === 'aim') {
                        const duration = Date.now() - this.aimStartTime;
                        clearTimeout(this.aimTimer);
                        if (duration < 500 && !this.isManualAiming) {
                            this.isTap = true;
                            this.triggerAutoFireFeedback();
                        } else {
                            this.isTap = false;
                        }
                        this.isAiming = false;
                        this.fireReleased = true;
                    }
                    this.resetJoystick(type);
                }
            }
        };
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }
    updateJoystick(touch, type) {
        const data = this.joyData[type];
        let dx = touch.clientX - data.cx;
        let dy = touch.clientY - data.cy;
        let dist = Math.hypot(dx, dy);
        if (dist > this.maxRadius) {
            const excess = dist - this.maxRadius;
            data.cx += (dx / dist) * excess;
            data.cy += (dy / dist) * excess;
            dx = touch.clientX - data.cx;
            dy = touch.clientY - data.cy;
            dist = this.maxRadius;
            this.updateBaseVisual(type);
        }
        const dirX = dist === 0 ? 0 : dx / dist;
        const dirY = dist === 0 ? 0 : dy / dist;
        data.stick.style.transform = `translate(${dx}px, ${dy}px)`;
        if (type === 'move') {
            const force = Math.min(dist / this.maxRadius, 1);
            this.move.x = dirX * force;
            this.move.y = dirY * force;
        } else if (type === 'aim') {
            this.aim.x = dirX;
            this.aim.y = dirY;
            if (dist > 5) {
                this.lastAim.x = dirX;
                this.lastAim.y = dirY;
            }
        }
    }
    updateBaseVisual(type) {
        const data = this.joyData[type];
        const deltaX = data.cx - data.ox;
        const deltaY = data.cy - data.oy;
        data.base.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
    resetJoystick(type) {
        const data = this.joyData[type];
        data.cx = data.ox;
        data.cy = data.oy;
        data.stick.style.transform = `translate(0px, 0px)`;
        data.base.style.transform = `translate(0px, 0px)`;
        if (type === 'move') {
            this.move = { x: 0, y: 0 };
        } else {
            this.aim = { x: 0, y: 0 };
        }
    }
    triggerAutoFireFeedback() {
        const baseEl = this.joyData.aim.base;
        if (!baseEl || this.feedbackTimer) clearTimeout(this.feedbackTimer);
        baseEl.style.transition = 'none';
        baseEl.style.opacity = '0.7';
        void baseEl.offsetWidth;
        baseEl.style.transition = 'opacity 0.25s ease-out';
        baseEl.style.opacity = '1';
        this.feedbackTimer = setTimeout(() => {
            baseEl.style.transition = '';
            this.feedbackTimer = null;
        }, 300);
    }
}
export const input = new Input();
