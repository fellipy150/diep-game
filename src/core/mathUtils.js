export function getSmartAim(shooterPos, targetPos, targetVel, baseSpeed, bulletType, targetRadius = 20) {
    if (bulletType === 'normal') {
        return predictInaccurate(shooterPos, targetPos, 0.15);
    }
    let effectiveSpeed = baseSpeed;
    if (bulletType === 'gigante') effectiveSpeed *= 0.3;
    if (bulletType === 'balinhas') effectiveSpeed *= 1.2;
    const lobbedTypes = ['bomba', 'acido', 'quicador', 'cola'];
    if (lobbedTypes.includes(bulletType)) {
        return predictLobbed(targetPos, targetVel, 1.5);
    }
    if (bulletType === 'teleguiada' || bulletType === 'drone') {
        return predictInaccurate(shooterPos, targetPos, 0.1);
    }
    if (bulletType === 'bumerangue') {
        let futureX = targetPos.x + (targetVel.x * 0.75);
        let futureY = targetPos.y + (targetVel.y * 0.75);
        let dx = futureX - shooterPos.x;
        let dy = futureY - shooterPos.y;
        let len = Math.hypot(dx, dy);
        return { x: dx / len, y: dy / len };
    }
    return predictIntercept(shooterPos, targetPos, targetVel, effectiveSpeed);
}
export function predictIntercept(shooterPos, targetPos, targetVel, bulletSpeed) {
    const rx = targetPos.x - shooterPos.x;
    const ry = targetPos.y - shooterPos.y;
    const a = (targetVel.x * targetVel.x) + (targetVel.y * targetVel.y) - (bulletSpeed * bulletSpeed);
    const b = 2 * ((rx * targetVel.x) + (ry * targetVel.y));
    const c = (rx * rx) + (ry * ry);
    const disc = (b * b) - (4 * a * c);
    if (disc < 0) return null;
    const t1 = (-b - Math.sqrt(disc)) / (2 * a);
    const t2 = (-b + Math.sqrt(disc)) / (2 * a);
    let t = Math.min(t1 > 0 ? t1 : Infinity, t2 > 0 ? t2 : Infinity);
    if (t === Infinity) return null;
    const futureX = targetPos.x + (targetVel.x * t);
    const futureY = targetPos.y + (targetVel.y * t);
    const dx = futureX - shooterPos.x;
    const dy = futureY - shooterPos.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len, targetX: futureX, targetY: futureY };
}
export function predictLobbed(targetPos, targetVel, flightTime) {
    const futureX = targetPos.x + (targetVel.x * flightTime);
    const futureY = targetPos.y + (targetVel.y * flightTime);
    return {
        targetX: futureX,
        targetY: futureY
    };
}
export function predictArea(shooterPos, targetPos, targetVel, bulletSpeed) {
    const dx = targetPos.x - shooterPos.x;
    const dy = targetPos.y - shooterPos.y;
    const dist = Math.hypot(dx, dy);
    const t = dist / bulletSpeed;
    const targetSpeed = Math.hypot(targetVel.x, targetVel.y);
    const maxRadius = targetSpeed * t;
    const randomAngle = Math.random() * Math.PI * 2;
    const randomR = Math.sqrt(Math.random()) * maxRadius;
    const targetX = targetPos.x + Math.cos(randomAngle) * randomR;
    const targetY = targetPos.y + Math.sin(randomAngle) * randomR;
    const finalDx = targetX - shooterPos.x;
    const finalDy = targetY - shooterPos.y;
    const len = Math.hypot(finalDx, finalDy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: finalDx / len, y: finalDy / len };
}
export function predictInaccurate(shooterPos, targetPos, inaccuracy = 0.2) {
    const dx = targetPos.x - shooterPos.x;
    const dy = targetPos.y - shooterPos.y;
    const baseAngle = Math.atan2(dy, dx);
    const finalAngle = baseAngle + (Math.random() - 0.5) * 2 * inaccuracy;
    return {
        x: Math.cos(finalAngle),
        y: Math.sin(finalAngle)
    };
}
export function predictEdge(shooterPos, targetPos, targetVel, bulletSpeed, targetRadius) {
    const intercept = predictIntercept(shooterPos, targetPos, targetVel, bulletSpeed);
    if (!intercept) return null;
    const futureX = intercept.targetX;
    const futureY = intercept.targetY;
    const backX = targetPos.x - futureX;
    const backY = targetPos.y - futureY;
    const backLen = Math.hypot(backX, backY);
    let edgeX = futureX;
    let edgeY = futureY;
    if (backLen > 0) {
        edgeX += (backX / backLen) * targetRadius;
        edgeY += (backY / backLen) * targetRadius;
    }
    const dx = edgeX - shooterPos.x;
    const dy = edgeY - shooterPos.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
}
