import { Bullet } from "./index.js";

export const ProjectilePool = {
    pool: [],

    // Pega uma bala reciclada ou cria uma nova se a piscina estiver vazia
    get(config) {
        if (this.pool.length > 0) {
            const bullet = this.pool.pop();
            bullet.init(config); // Reseta os dados da bala velha
            return bullet;
        }
        return new Bullet(config);
    },

    // Devolve a bala morta para a piscina
    release(bullet) {
        this.pool.push(bullet);
    }
};
