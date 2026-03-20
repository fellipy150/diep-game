import { Joystick } from './Joystick.js';
import { Utils } from './Utils.js';
import { JOYSTICK_MAX_RADIUS, AIM_TAP_THRESHOLD_MS, AIM_DRAG_THRESHOLD } from './Constants.js';

export class AimController {
    constructor(baseEl, stickEl) {
        this.joy = new Joystick(baseEl, stickEl, JOYSTICK_MAX_RADIUS);
        this.value = { x: 0, y: 0 };
        this.lastAim = { x: 1, y: 0 };
        this.isAiming = false;
        this.isManualAiming = false;
        this.fireReleased = false;
        this.isTap = false;
        this.aimTimer = null;
        this.feedbackTimer = null;
        this.startTime = 0;
        this.startPos = { x: 0, y: 0 };
        if (baseEl && stickEl) {
            requestAnimationFrame(() => this.joy.init());
            this.initEvents();
        }
    }
    initEvents() {
        this.joy.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (this.joy.touchId === null) {
                    this.joy.activate(touch.clientX, touch.clientY, touch.identifier);
                    this.startTime = Date.now();
                    this.startPos = { x: touch.clientX, y: touch.clientY };
                    this.isManualAiming = false;
                    clearTimeout(this.aimTimer);
                    this.aimTimer = setTimeout(() => {
                        this.isManualAiming = true;
                        this.isAiming = true;
                    }, AIM_TAP_THRESHOLD_MS);
                }
            }
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joy.touchId) {
                    const distMoved = Utils.getDist(touch.clientX - this.startPos.x, touch.clientY - this.startPos.y);
                    if (distMoved > AIM_DRAG_THRESHOLD) {
                        clearTimeout(this.aimTimer);
                        this.isManualAiming = true;
                        this.isAiming = true;
                    }
                    const output = this.joy.update(touch.clientX, touch.clientY);
                    this.value.x = output.x;
                    this.value.y = output.y;
                    if (output.distance > 5) {
                        this.lastAim.x = output.x;
                        this.lastAim.y = output.y;
                    }
                }
            }
        }, { passive: false });
        const handleEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joy.touchId) {
                    const duration = Date.now() - this.startTime;
                    clearTimeout(this.aimTimer);
                    if (duration < AIM_TAP_THRESHOLD_MS && !this.isManualAiming) {
                        this.isTap = true;
                        this.triggerFeedback();
                    } else {
                        this.isTap = false;
                    }
                    this.isAiming = false;
                    this.fireReleased = true;
                    this.joy.reset();
                    this.value.x = 0;
                    this.value.y = 0;
                }
            }
        };
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }
    triggerFeedback() {
        const baseEl = this.joy.base;
        if (!baseEl) return;
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
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
