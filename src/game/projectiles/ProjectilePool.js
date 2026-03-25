import { Bullet } from './index.js'

export const ProjectilePool = {
  pool: [],
  get(config) {
    if (this.pool.length > 0) {
      const bullet = this.pool.pop()
      bullet.init(config)
      return bullet
    }
    return new Bullet(config)
  },
  release(bullet) {
    this.pool.push(bullet)
  },
}
