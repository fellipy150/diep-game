// Importamos o input diretamente para evitar o erro de 'undefined' no gameState
import { input } from '../../../core/input/index.js'; 
import { drawJoysticks } from './JoystickHUD.js';
import { drawWeaponSlots } from './WeaponSlotsHUD.js';
import { drawSwapButton } from './SwapButtonHUD.js';
import { drawPlayerStatus } from './PlayerStatusHUD.js';

export function renderHUD(ctx, canvas, gameState) {
    const { player } = gameState;
    
    // Se o player morreu ou não carregou, não desenhamos a interface de jogo
    if (!player) return;

    // 0. Status Superior (Level e XP) - Fica no topo
    drawPlayerStatus(ctx, player, canvas);

    // 1. Joysticks (Vermelho e Branco)
    // Usamos o 'input' importado lá no topo. É infalível.
    drawJoysticks(ctx, input);

    // 2. Slots de Arma (Embaixo, no centro)
    if (player.loadout) {
        drawWeaponSlots(ctx, player, canvas);
        // 3. Botão de Swap (Perto do joystick de mira)
        drawSwapButton(ctx, player, canvas);
    }
}
