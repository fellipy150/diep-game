// src/game/synergies/index.js

// Exportamos o motor e o registro para que outros módulos 
// usem apenas import { SynergyEngine } from '../synergies/index.js'
export { SynergyEngine } from './SynergyEngine.js';
export { SynergyRegistry } from './SynergyRegistry.js';

/**
 * Dica: O getSynergyHint da V1 pode ser útil no futuro se você quiser 
 * mostrar no menu de upgrade quais itens faltam para completar uma receita.
 */
export function getSynergyHint(player, upgrade) {
    // Lógica futura para UI de "Preview" de sinergia
    return null;
}
