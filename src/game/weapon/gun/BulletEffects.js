export const BulletEffects = {
    Ricochet: {
        id: 'ricochet',
        onHit: (bullet, _target, _context) => {
            if (bullet.bounces > 0) {
                bullet.vx *= -1;
                bullet.vy *= -1;
                bullet.bounces--;
                bullet.dead = false;
                return true;
            }
            return false;
        }
    },
    Pierce: {
        id: 'pierce',
        onHit: (bullet, _target, _context) => {
            if (bullet.pierceCount > 0) {
                bullet.pierceCount--;
                bullet.dead = false;
                return true;
            }
            return false;
        }
    }
};
