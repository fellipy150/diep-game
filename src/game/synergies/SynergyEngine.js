import { SynergyRegistry } from './SynergyRegistry.js';
import { showSynergyToast } from '../ui/SynergyToast.js';

/**
 * SynergyEngine: O cérebro por trás das combinações de poder.
 * Responsável por detectar, ativar e processar o tempo de vida das sinergias.
 */
export const SynergyEngine = {
    
    /**
     * Avaliação Estática: Chamada apenas quando o inventário ou arma muda (ex: Level Up).
     * Evita percorrer o registro inteiro em todos os frames desnecessariamente.
     */
    evaluate(player) {
        if (!player || !player.weapon) return;

        const currentBullet = player.weapon.bulletType || player.currentBulletType;

        for (const syn of SynergyRegistry) {
            // 1. Verificação de Requisito de Bala
            const hasRightBullet = syn.requiredBulletId === '*' || syn.requiredBulletId === currentBullet;
            
            // 2. Verificação de Requisito de Upgrades (Powerups)
            const upgradeCount = player.upgradeCounts[syn.requiredPowerupId] || 0;
            const meetsUpgrades = upgradeCount >= syn.requiredCount;

            if (hasRightBullet && meetsUpgrades) {
                // Ativa se o jogador ainda não possui
                if (!player.activeSynergies.has(syn.id)) {
                    this.addSynergy(player, syn);
                }
            } else {
                // Remove se os requisitos deixaram de ser atendidos
                this.removeSynergy(player, syn.id);
            }
        }
    },

    /**
     * Avaliação Dinâmica: Chamada a cada frame no Player.update.
     * Gerencia timers de expiração e condições situacionais (ex: HP baixo).
     */
    update(player, dt, context) {
        if (!player.activeSynergies || player.activeSynergies.size === 0) return;

        player.activeSynergies.forEach(synId => {
            const syn = SynergyRegistry.find(s => s.id === synId);
            if (!syn) return;

            // --- Gestão de Duração (Sinergias Temporárias) ---
            if (syn.duration !== null) {
                player.synergyTimers = player.synergyTimers || {};
                
                // Inicializa o timer se for novo
                if (player.synergyTimers[synId] === undefined) {
                    player.synergyTimers[synId] = syn.duration;
                }
                
                player.synergyTimers[synId] -= dt;
                
                if (player.synergyTimers[synId] <= 0) {
                    this.removeSynergy(player, synId);
                    delete player.synergyTimers[synId];
                    return; 
                }
            }

            // --- Gestão de Condições Dinâmicas ---
            // (Ex: A sinergia existe, mas o efeito só "liga" se o HP < 30%)
            if (syn.condition) {
                const conditionMet = syn.condition(context, player);
                player.synergyConditionsMet = player.synergyConditionsMet || {};
                player.synergyConditionsMet[synId] = conditionMet;
            }
        });
    },

    /**
     * Ativa formalmente uma sinergia e dispara o feedback visual.
     */
    addSynergy(player, syn) {
        // 1. Registra no Set de sinergias ativas do jogador
        player.activeSynergies.add(syn.id);
        
        // 2. Log tático para debug
        console.log(`✨ Sinergia Ativada: ${syn.name} (${syn.id})`);
        
        // 3. Dispara o Toast passando o objeto completo (nome, descrição, cores)
        showSynergyToast(syn);

        // 4. Feedback tátil opcional (tremor leve na tela ao ativar algo poderoso)
        if (typeof camera !== 'undefined' && camera.shake !== undefined) {
            camera.shake = Math.max(camera.shake, 8);
        }
    },

    /**
     * Remove uma sinergia do jogador.
     */
    removeSynergy(player, synId) {
        if (player.activeSynergies.has(synId)) {
            player.activeSynergies.delete(synId);
            
            // Limpa estados secundários relacionados a essa sinergia
            if (player.synergyConditionsMet) delete player.synergyConditionsMet[synId];
            if (player.synergyTimers) delete player.synergyTimers[synId];
            
            console.log(`❌ Sinergia Desativada: ${synId}`);
        }
    }
};

