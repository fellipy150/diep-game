// src/game/ui/HUD/JoystickHUD.js
export function drawJoysticks(ctx, inputManager) {
    if (inputManager.moveCtrl) {
        drawSingleJoystick(ctx, inputManager.moveCtrl, "rgba(255, 0, 0, 0.3)");
    }
    if (inputManager.aimCtrl) {
        const opacity = inputManager.isTap ? 0.4 : 0.8;
        drawSingleJoystick(ctx, inputManager.aimCtrl, `rgba(255, 255, 255, ${opacity * 0.2})`);
    }
}
function drawSingleJoystick(ctx, controller, color) {
    if (!controller.touchId && controller.touchId !== 0) return;
    const { cx, cy } = controller;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}
