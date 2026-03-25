export const Utils = {
  getDist: (dx, dy) => Math.hypot(dx, dy),
  getDistSq: (dx, dy) => dx * dx + dy * dy,
  normalize: (dx, dy) => {
    const dist = Math.hypot(dx, dy)
    if (dist === 0) return { x: 0, y: 0 }
    return { x: dx / dist, y: dy / dist }
  },
  clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
  lerp: (start, end, t) => start * (1 - t) + end * t,
  degToRad: degrees => (degrees * Math.PI) / 180,
}
