import { input } from '../../../core/input/index.js';
import { drawJoysticks } from './JoystickHUD.js';
import { drawWeaponSlots } from './WeaponSlotsHUD.js';
import { drawSwapButton } from './SwapButtonHUD.js';
import { drawPlayerStatus } from './PlayerStatusHUD.js';

export function renderHUD(ctx, canvas, gameState) {
    const { player } = gameState;
    if (!player) return;
    drawPlayerStatus(ctx, player, canvas);
    drawJoysticks(ctx, input);
    if (player.loadout) {
        drawWeaponSlots(ctx, player, canvas);
        drawSwapButton(ctx, player, canvas);
    }
}
