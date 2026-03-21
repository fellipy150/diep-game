// src/game/ui/HUD/JoystickHUD.js

export function drawJoysticks(ctx, inputManager) {
    // 🔴 O erro acontecia aqui: acessamos moveCtrl e aimCtrl em vez de joyData
    if (inputManager.moveCtrl) {
        drawSingleJoystick(ctx, inputManager.moveCtrl, "rgba(255, 0, 0, 0.3)");
    }

    if (inputManager.aimCtrl) {
        const opacity = inputManager.isTap ? 0.4 : 0.8;
        drawSingleJoystick(ctx, inputManager.aimCtrl, `rgba(255, 255, 255, ${opacity * 0.2})`);
    }
}

function drawSingleJoystick(ctx, controller, color) {
    // Verificamos se o controlador tem um toque ativo (id) 
    // e se ele expõe as coordenadas de centro dinâmico (cx, cy)
    if (!controller.touchId && controller.touchId !== 0) return;

    const { cx, cy } = controller; // Assumindo que o Controller expõe cx e cy

    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Se quiser desenhar o "stick" (bolinha interna) no canvas também:
    // const { stickX, stickY } = controller;
    // ctx.beginPath();
    // ctx.arc(cx + stickX, cy + stickY, 20, 0, Math.PI * 2);
    // ctx.fillStyle = "white";
    // ctx.fill();
}
