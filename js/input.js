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
        // Quando o dedo toca a base do joystick correspondente
        baseEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                // Associa o ID do dedo ao joystick correto
                if (type === 'move' && this.moveTouchId === null) {
                    this.moveTouchId = touch.identifier;
                    this.updateJoystick(touch, baseEl, stickEl, type);
                } else if (type === 'aim' && this.aimTouchId === null) {
                    this.aimTouchId = touch.identifier;
                    this.isShooting = true; // Aciona o gatilho automático!
                    this.updateJoystick(touch, baseEl, stickEl, type);
                }
            }
        }, { passive: false });

        // Eventos de mover e soltar ficam no documento inteiro,
        // assim o jogador não perde o controle se o dedo sair de cima da div.
        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.moveTouchId) {
                    this.updateJoystick(touch, baseEl, stickEl, 'move');
                } else if (touch.identifier === this.aimTouchId) {
                    this.updateJoystick(touch, baseEl, stickEl, 'aim');
                }
            }
        }, { passive: false });

        const handleEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.resetJoystick(stickEl, 'move');
                } else if (touch.identifier === this.aimTouchId) {
                    this.aimTouchId = null;
                    this.isShooting = false; // Soltou o dedo, para de atirar
                    this.resetJoystick(stickEl, 'aim');
                }
            }
        };

        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }

    updateJoystick(touch, baseEl, stickEl, type) {
        // Pega as coordenadas exatas da base na tela
        const rect = baseEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Vetor de diferença entre o toque e o centro
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        let dist = Math.hypot(dx, dy);

        // Direção Normalizada (Vetor unitário)
        let dirX = dist === 0 ? 0 : dx / dist;
        let dirY = dist === 0 ? 0 : dy / dist;

        // Deslocamento visual limitado ao raio máximo
        let visualDist = Math.min(dist, this.maxRadius);
        stickEl.style.transform = `translate(${dirX * visualDist}px, ${dirY * visualDist}px)`;

        // Atualiza os valores na classe para serem usados pelo Player
        if (type === 'move') {
            // O movimento varia de 0 a 1 em força (permitindo andar devagar)
            let force = Math.min(dist / this.maxRadius, 1);
            this.move.x = dirX * force;
            this.move.y = dirY * force;
        } else if (type === 'aim') {
            // A mira só precisa da direção absoluta
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
            // Não zeramos a mira para o jogador continuar olhando para o último lado atirado,
            // ou podemos zerar. Deixei zerado para seguir o padrão, mas a flag isShooting é o que manda.
            this.aim.x = 0;
            this.aim.y = 0;
        }
    }
}

