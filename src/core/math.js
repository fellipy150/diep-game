// ==========================================
// MATEMÁTICA BÁSICA E OTIMIZADA
// ==========================================
export const MathUtils = {
    // Distância ao quadrado (Super rápido, sem raiz quadrada)
    distSq: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },
    
    // Pega a direção normalizada (Vetor unitário)
    getDir: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy) || 1;
        return { x: dx / dist, y: dy / dist };
    }
};

// ==========================================
// CINEMÁTICA E PREVISÃO DE TIROS (SMART AIM)
// ==========================================

const toDir = (dx, dy, tx, ty) => {
    const len = Math.hypot(dx, dy);
    return {
        x: len === 0 ? 0 : dx / len,
        y: len === 0 ? 0 : dy / len,
        targetX: tx,
        targetY: ty
    };
};

export function predictIntercept(shooterPos, targetPos, targetVel, bulletSpeed) {
    const rx = targetPos.x - shooterPos.x;
    const ry = targetPos.y - shooterPos.y;
    // Resolução da Equação Quadrática para intersecção de movimento
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

export function getSmartAim(shooterPos, targetPos, targetVel, baseSpeed, bulletType, _targetRadius = 20) {
    const speedMods = { gigante: 0.3, balinhas: 1.2 };
    const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
    const effectiveSpeed = baseSpeed * (speedMods[bulletType] || 1);
    
    if (bulletType === 'normal') {
        return predictInaccurate(shooterPos, targetPos, 0.15);
    }
    if (lobbedTypes.includes(bulletType)) {
        return predictLobbed(shooterPos, targetPos, targetVel, 1.5); // 1.5s de tempo de voo projetado
    }
    if (bulletType === 'teleguiada' || bulletType === 'drone') {
        return predictInaccurate(shooterPos, targetPos, 0.1);
    }
    if (bulletType === 'bumerangue') {
        const time = 0.75; // Tempo até o retorno
        const tx = targetPos.x + (targetVel.x * time);
        const ty = targetPos.y + (targetVel.y * time);
        return toDir(tx - shooterPos.x, ty - shooterPos.y, tx, ty);
    }
    
    // Padrão: Interceptação precisa
    return predictIntercept(shooterPos, targetPos, targetVel, effectiveSpeed);
}

