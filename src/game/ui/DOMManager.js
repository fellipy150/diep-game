export const DOMManager = {
    init(player) {
        this.xpBar = document.getElementById('xp-bar');
        this.levelText = document.getElementById('level-text');
        this.hotbar = document.getElementById('hotbar');
        
        // Novo container de peso (substituindo os textos antigos)
        this.weightContainer = document.getElementById('weight-bar-container');
        
        // Listener para cliques na Hotbar (Troca de arma)
        this.hotbar.addEventListener('pointerdown', (e) => {
            const slot = e.target.closest('.hotbar-slot');
            if (slot) {
                e.stopPropagation(); // Impede que o toque ative o joystick no canvas
                
                const index = parseInt(slot.dataset.index);
                player.inventory.equip(index);
                
                // Redesenha para atualizar a borda de seleção 'active'
                this.updateHotbar(player.inventory);
            }
        });
    },

    /**
     * Atualiza os elementos estáticos da HUD (XP, Nível, Peso).
     */
    updateHUD(player) {
        // 1. Atualiza XP
        const xpPercent = Math.min(100, (player.xp / player.xpNeeded) * 100);
        this.xpBar.style.width = `${xpPercent}%`;
        this.levelText.innerText = `Nível ${player.level}`;

        // 🔴 2. NOVA LÓGICA DA BARRA DE PESO VERTICAL
        if (this.weightContainer) {
            const capacity = player.inventory.capacity;
            const used = player.inventory.currentWeight;
            
            this.weightContainer.innerHTML = ''; // Limpa os blocos
            
            // Cria um bloco para cada espaço de capacidade
            for (let i = 0; i < capacity; i++) {
                const segment = document.createElement('div');
                segment.className = 'weight-segment';
                
                // Preenche de CIMA para BAIXO: os primeiros 'used' ficam cinzas.
                if (i < used) {
                    segment.classList.add('used'); 
                }
                
                this.weightContainer.appendChild(segment);
            }
        }
    },

    /**
     * Reconstrói a estrutura HTML da Hotbar.
     * Chamado apenas quando o jogador ganha/perde armas ou troca a seleção.
     */
    updateHotbar(inventory) {
        this.hotbar.innerHTML = '';

        inventory.weapons.forEach((entry, index) => {
            const slot = document.createElement('div');
            
            // Adiciona classe 'active' se for a arma selecionada
            slot.className = `hotbar-slot ${index === inventory.activeIndex ? 'active' : ''}`;
            slot.dataset.index = index;

            // 🔴 REMOVIDO O EMOJI. Preparado para receber URL de imagem futuramente.
            // Se houver um entry.weapon.icon (como 'assets/gun.png'), ele usa no background
            const iconUrl = entry.weapon.icon && entry.weapon.icon.endsWith('.png') 
                            ? `url('${entry.weapon.icon}')` 
                            : 'none';

            // Estrutura interna com div de imagem e munição base
            slot.innerHTML = `
                <div class="slot-icon" style="background-image: ${iconUrl};"></div>
                <span class="slot-ammo">${Math.floor(entry.weapon.currentAmmo)}/${entry.weapon.magSize}</span>
            `;

            this.hotbar.appendChild(slot);
        });
    },

    /**
     * Atualiza apenas os números de munição nos slots existentes.
     * Chamado todo frame dentro do loop de atualização para performance.
     */
    updateAmmoUI(inventory) {
        const slots = this.hotbar.querySelectorAll('.hotbar-slot');
        
        inventory.weapons.forEach((entry, index) => {
            const weapon = entry.weapon;
            const ammoDisplay = slots[index]?.querySelector('.slot-ammo');
            
            if (ammoDisplay) {
                const current = Math.floor(weapon.currentAmmo);
                ammoDisplay.innerText = `${current}/${weapon.magSize}`;
                
                // Feedback visual: Vermelho se estiver sem balas
                if (current === 0) {
                    ammoDisplay.style.color = "#ff4444";
                    ammoDisplay.style.fontWeight = "bold";
                } else {
                    ammoDisplay.style.color = "white";
                    ammoDisplay.style.fontWeight = "normal";
                }
            }
        });
    }
};

// Disponibiliza globalmente para facilitar a comunicação com o player.js e progress.js
window.DOMManager = DOMManager;


