export class Input {
    constructor() {
        // Estado lido pelas entidades
        this.move = { x: 0, y: 0 };
        this.aim = { x: 0, y: 0 };
        this.isShooting = false;

        // Referências DOM
        this.joyMove = document.getElementById('joystick-move');
        this.stickMove = document.getElementById('stick-move');
        this.joyAim = document.getElementById('joystick-aim');
        this.stickAim = document.getElementById('stick-aim');

        // IDs para rastrear múltiplos toques simultâneos (multi-touch)
        this.moveTouchId = null;
        this.aimTouchId = null;

        // Raio máximo que o stick pode afastar do centro visualmente
        this.maxRadius = 40; 

        this.initEvents();
    }

    initEvents() {
        // Previne comportamentos de scroll na tela inteira
        document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        this.setupJoystick(this.joyMove, this.stickMove, 'move');
        this.setupJoystick(this.joyAim, this.stickAim, 'aim');
    }

    setupJoystick(baseEl, stickEl, type) {
        baseEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Calcula o centro do joystick apenas no momento do toque, de forma fixa
            const rect = baseEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                // Associa estritamente o dedo a este joystick
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
                // Só atualiza se o ID do dedo corresponder estritamente ao joystick
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
                    this.isShooting = false; // Soltou o dedo, para de atirar
                    this.resetJoystick(this.stickAim, 'aim');
                }
            }
        };

        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }

    updateJoystick(touch, centerX, centerY, stickEl, type) {
        // Agora o dx e dy são estritamente calculados a partir do centro da base do joystick
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        let dist = Math.hypot(dx, dy);

        let dirX = dist === 0 ? 0 : dx / dist;
        let dirY = dist === 0 ? 0 : dy / dist;

        let visualDist = Math.min(dist, this.maxRadius);
        stickEl.style.transform = `translate(${dirX * visualDist}px, ${dirY * visualDist}px)`;

        if (type === 'move') {
            let force = Math.min(dist / this.maxRadius, 1);
            this.move.x = dirX * force;
            this.move.y = dirY * force;
        } else if (type === 'aim') {
            this.aim.x = dirX;
            this.aim.y = dirY;
        }
    }

    resetJoystick(stickEl, type) {
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
