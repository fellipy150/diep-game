import { MoveController } from './MoveController.js';
import { AimController } from './AimController.js';

class InputManager {
    constructor() {
        const baseMove = document.getElementById('joystick-move');
        const stickMove = document.getElementById('stick-move');
        const baseAim = document.getElementById('joystick-aim');
        const stickAim = document.getElementById('stick-aim');
        this.moveCtrl = new MoveController(baseMove, stickMove);
        this.aimCtrl = new AimController(baseAim, stickAim);
        // Prevenção global de scroll/zoom do navegador em dispositivos mobile
        this.setupGlobalPrevention();
    }
    get move() { return this.moveCtrl.value; }
    get aim() { return this.aimCtrl.value; }
    get lastAim() { return this.aimCtrl.lastAim; }
    set lastAim(val) { this.aimCtrl.lastAim = val; }
    get isAiming() { return this.aimCtrl.isAiming; }
    get isTap() { return this.aimCtrl.isTap; }
    // Combate (O Set é necessário porque a GunWeapon/Player faz: input.fireReleased = false)
    get fireReleased() { return this.aimCtrl.fireReleased; }
    set fireReleased(val) { this.aimCtrl.fireReleased = val; }
    setupGlobalPrevention() {
        const handlePrevention = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                if (e.cancelable) e.preventDefault();
            }
        };
        document.addEventListener('touchstart', handlePrevention, { passive: false });
        document.addEventListener('touchmove', handlePrevention, { passive: false });
    }
}
export const input = new InputManager();
