export class SwapController {
    constructor() {
        this._fireSwap = false;
        this.initEvents();
    }
    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyQ' || e.code === 'Tab') {
                e.preventDefault();
                this._fireSwap = true;
            }
        });
    }
    get value() {
        return this._fireSwap;
    }
    set value(val) {
        this._fireSwap = val;
    }
}
