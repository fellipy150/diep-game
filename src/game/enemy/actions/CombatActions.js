import { simpleShoot } from './simpleShoot.js';
import { Attack } from './Attack.js';

export const CombatActions = {
    // Agora o simpleShoot aponta para o arquivo que preenchemos
    simpleShoot: simpleShoot,
    
    // 🎯 RECONECTADO: Agora a IA avançada de tiro com previsão de trajetória (math.js) está disponível!
    attack: Attack 
};


