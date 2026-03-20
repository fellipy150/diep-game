export class Joystick {
    constructor(baseEl, stickEl, maxRadius = 40) {
        this.base = baseEl;
        this.stick = stickEl;
        this.maxRadius = maxRadius;
        this.touchId = null;
        this.ox = 0;
        this.oy = 0;
        this.cx = 0;
        this.cy = 0;
        this.output = {
            x: 0,
            y: 0,
            distance: 0
        };
        this.init();
    }
    init() {
        if (!this.base) return;
        const rect = this.base.getBoundingClientRect();
        this.ox = rect.left + rect.width / 2;
        this.oy = rect.top + rect.height / 2;
        this.cx = this.ox;
        this.cy = this.oy;
    }
    activate(touchX, touchY, identifier) {
        this.touchId = identifier;
        this.cx = touchX;
        this.cy = touchY;
        this.updateBaseVisual();
    }
    update(touchX, touchY) {
        let dx = touchX - this.cx;
        let dy = touchY - this.cy;
        let dist = Math.hypot(dx, dy);
        if (dist > this.maxRadius) {
            const excess = dist - this.maxRadius;
            this.cx += (dx / dist) * excess;
            this.cy += (dy / dist) * excess;
            dx = touchX - this.cx;
            dy = touchY - this.cy;
            dist = this.maxRadius;
            this.updateBaseVisual();
        }
        this.stick.style.transform = `translate(${dx}px, ${dy}px)`;
        this.output.distance = dist;
        this.output.x = dist === 0 ? 0 : dx / dist;
        this.output.y = dist === 0 ? 0 : dy / dist;
        return this.output;
    }
    updateBaseVisual() {
        const deltaX = this.cx - this.ox;
        const deltaY = this.cy - this.oy;
        this.base.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
    reset() {
        this.touchId = null;
        this.cx = this.ox;
        this.cy = this.oy;
        this.output.x = 0;
        this.output.y = 0;
        this.output.distance = 0;
        this.stick.style.transform = `translate(0px, 0px)`;
        this.base.style.transform = `translate(0px, 0px)`;
    }
}
