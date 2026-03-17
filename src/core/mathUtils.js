/**
 * Helper para normalizar vetores e evitar repetição de código
 */
const toDir = (dx, dy, tx, ty) => {
    const len = Math.hypot(dx, dy);
    return {
        x: len === 0 ? 0 : dx / len,
        y: len === 0 ? 0 : dy / len,
        targetX: tx,
        targetY: ty
    };
};

export function getSmartAim(shooterPos, targetPos, targetVel, baseSpeed, bulletType, _targetRadius = 20) {
    // 1. Configurações de Comportamento (Fácil de balancear)
    const speedMods = { gigante: 0.3, balinhas: 1.2 };
    const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
    
    let effectiveSpeed = baseSpeed * (speedMods[bulletType] || 1);

    // 2. Seleção de Estratégia
    if (bulletType === 'normal') {
        return predictInaccurate(shooterPos, targetPos, 0.15);
    }

    if (lobbedTypes.includes(bulletType)) {
        return predictLobbed(shooterPos, targetPos, targetVel, 1.5);
    }

    if (bulletType === 'teleguiada' || bulletType === 'drone') {
        return predictInaccurate(shooterPos, targetPos, 0.1);
    }

    if (bulletType === 'bumerangue') {
        const time = 0.75;
        const tx = targetPos.x + (targetVel.x * time);
        const ty = targetPos.y + (targetVel.y * time);
        return toDir(tx - shooterPos.x, ty - shooterPos.y, tx, ty);
    }

    // Padrão: Interceptação precisa (Cálculo Quadrático)
    return predictIntercept(shooterPos, targetPos, targetVel, effectiveSpeed);
}

export function predictIntercept(shooterPos, targetPos, targetVel, bulletSpeed) {
    const rx = targetPos.x - shooterPos.x;
    const ry = targetPos.y - shooterPos.y;

    // Equação quadrática: a*t^2 + b*t + c = 0
    const a = (targetVel.x ** 2) + (targetVel.y ** 2) - (bulletSpeed ** 2);
    const b = 2 * (rx * targetVel.x + ry * targetVel.y);
    const c = (rx ** 2) + (ry ** 2);

    const disc = (b * b) - (4 * a * c);
    if (disc < 0) return toDir(rx, ry, targetPos.x, targetPos.y);

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    
    const t = Math.min(t1 > 0 ? t1 : Infinity, t2 > 0 ? t2 : Infinity);
    if (t === Infinity) return toDir(rx, ry, targetPos.x, targetPos.y);

    const tx = targetPos.x + targetVel.x * t;
    const ty = targetPos.y + targetVel.y * t;
    
    return toDir(tx - shooterPos.x, ty - shooterPos.y, tx, ty);
}

export function predictLobbed(shooterPos, targetPos, targetVel, flightTime) {
    const tx = targetPos.x + (targetVel.x * flightTime);
    const ty = targetPos.y + (targetVel.y * flightTime);
    return toDir(tx - shooterPos.x, ty - shooterPos.y, tx, ty);
}

export function predictInaccurate(shooterPos, targetPos, inaccuracy = 0.2) {
    const dx = targetPos.x - shooterPos.x;
    const dy = targetPos.y - shooterPos.y;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2 * inaccuracy;
    
    return {
        x: Math.cos(angle),
        y: Math.sin(angle),
        targetX: targetPos.x,
        targetY: targetPos.y
    };
}

export function predictEdge(shooterPos, targetPos, targetVel, bulletSpeed, _targetRadius) {
    const intercept = predictIntercept(shooterPos, targetPos, targetVel, bulletSpeed);
    const tx = intercept.targetX;
    const ty = intercept.targetY;
    
    const backX = targetPos.x - tx;
    const backY = targetPos.y - ty;
    const dist = Math.hypot(backX, backY) || 1;

    const edgeX = tx + (backX / dist) * _targetRadius;
    const edgeY = ty + (backY / dist) * _targetRadius;

    return toDir(edgeX - shooterPos.x, edgeY - shooterPos.y, edgeX, edgeY);
}
