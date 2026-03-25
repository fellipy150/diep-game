import { MathUtils } from '../core/math.js'
import { gameState, criarNumeroDano } from './state.js'
import { camera } from './renderer.js'
import { MeleeAction } from './enemy/actions/meleeAction.js'
import { gameData } from '../config/configManager.js'

const verificarColisao = (o1, o2) => {
  const rSum = (o1.radius || 10) + (o2.radius || 10)
  if (Math.abs(o1.x - o2.x) > rSum || Math.abs(o1.y - o2.y) > rSum) {
    return false
  }
  return MathUtils.distSq(o1.x, o1.y, o2.x, o2.y) < rSum * rSum
}
const aplicarEfeitoDeStatus = (entidade, tipo, duracao = 2.0) => {
  if (tipo === 'cola' || tipo === 'glue' || tipo === 'stun') {
    if (typeof entidade.addStatusEffect === 'function') {
      entidade.addStatusEffect(tipo, duracao)
    } else {
      entidade.speedMultiplicador = tipo === 'stun' ? 0 : 0.3
      entidade.efeitoColaTimer = duracao
    }
  }
}
export function processarColisoes() {
  const { player, enemies, hazards } = gameState
  if (!player) return
  for (let i = 0; i < enemies.length; i++) {
    const e1 = enemies[i]
    if (e1.dead) continue
    const minDistP = player.radius + e1.radius
    const distSqP = MathUtils.distSq(e1.x, e1.y, player.x, player.y)
    if (distSqP < minDistP * minDistP) {
      const dir = MathUtils.getDir(e1.x, e1.y, player.x, player.y)
      const overlap = (minDistP - dir.dist) / 2
      if (overlap > 0) {
        player.x += dir.x * overlap
        player.y += dir.y * overlap
        e1.x -= dir.x * overlap
        e1.y -= dir.y * overlap
      }
      MeleeAction.execute(e1, player, criarNumeroDano)
      const tempoAtual = performance.now()
      const cooldownDano = 500
      if (
        !e1.ultimoDanoContato ||
        tempoAtual - e1.ultimoDanoContato > cooldownDano
      ) {
        const danoContato = player.stats.get('meleeDamage')
        e1.takeDamage(danoContato, 'player')
        e1.outOfCombatTimer = 0
        player.outOfCombatTimer = 0
        if (e1.hp <= 0) e1.killedByPlayer = true
        criarNumeroDano(e1.x, e1.y, danoContato, 'white')
        e1.ultimoDanoContato = tempoAtual
        const forcaEmpurrao = 800
        const forcaRecuo = 300
        e1.velX = (e1.velX || 0) - dir.x * forcaEmpurrao
        e1.velY = (e1.velY || 0) - dir.y * forcaEmpurrao
        player.velX = (player.velX || 0) + dir.x * forcaRecuo
        player.velY = (player.velY || 0) + dir.y * forcaRecuo
      }
    }
    for (let j = i + 1; j < enemies.length; j++) {
      const e2 = enemies[j]
      if (e2.dead) continue
      const minDistE = e1.radius + e2.radius
      if (MathUtils.distSq(e2.x, e2.y, e1.x, e1.y) < minDistE * minDistE) {
        const dir = MathUtils.getDir(e2.x, e2.y, e1.x, e1.y)
        const overlap = (minDistE - dir.dist) / 2
        if (overlap > 0) {
          e1.x += dir.x * overlap
          e1.y += dir.y * overlap
          e2.x -= dir.x * overlap
          e2.y -= dir.y * overlap
        }
        const forcaRepulsao = 300
        e1.velX = (e1.velX || 0) + dir.x * forcaRepulsao
        e1.velY = (e1.velY || 0) + dir.y * forcaRepulsao
        e2.velX = (e2.velX || 0) - dir.x * forcaRepulsao
        e2.velY = (e2.velY || 0) - dir.y * forcaRepulsao
        const tempoAtual = performance.now()
        const cooldownInfight = 600
        if (
          !e1.ultimoDanoEmAliado ||
          tempoAtual - e1.ultimoDanoEmAliado > cooldownInfight
        ) {
          e2.takeDamage(15, 'environment')
          criarNumeroDano(e2.x, e2.y, 15, 'orange')
          e1.ultimoDanoEmAliado = tempoAtual
        }
        if (
          !e2.ultimoDanoEmAliado ||
          tempoAtual - e2.ultimoDanoEmAliado > cooldownInfight
        ) {
          e1.takeDamage(15, 'environment')
          criarNumeroDano(e1.x, e1.y, 15, 'orange')
          e2.ultimoDanoEmAliado = tempoAtual
        }
      }
    }
  }
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const b = player.bullets[i]
    if (b.dead) continue
    for (const e of enemies) {
      if (!e.dead && verificarColisao(b, e)) {
        e.takeDamage(b.damage, 'player')
        e.outOfCombatTimer = 0
        if (e.hp <= 0) e.killedByPlayer = true
        camera.shake = 8
        criarNumeroDano(e.x, e.y, b.damage, 'white')
        b.onHit(e)
        if (b.dead) break
      }
    }
  }
  for (const atirador of enemies) {
    if (!atirador.bullets) continue
    for (let i = atirador.bullets.length - 1; i >= 0; i--) {
      const b = atirador.bullets[i]
      if (b.dead || !b.radius) continue
      if (verificarColisao(b, player)) {
        player.hp -= b.damage
        player.outOfCombatTimer = 0
        atirador.outOfCombatTimer = 0
        camera.shake = 12
        criarNumeroDano(player.x, player.y, b.damage, 'red')
        const bulletCfg = gameData.bullets[b.type]
        if (bulletCfg?.effect === 'stun') {
          aplicarEfeitoDeStatus(player, 'stun', 1.5)
        }
        b.onHit(player)
        continue
      }
      for (const vitima of enemies) {
        if (
          atirador !== vitima &&
          !vitima.dead &&
          verificarColisao(b, vitima)
        ) {
          vitima.takeDamage(b.damage, 'environment')
          vitima.outOfCombatTimer = 0
          criarNumeroDano(vitima.x, vitima.y, b.damage, 'white')
          b.onHit(vitima)
          break
        }
      }
    }
  }
  if (hazards) {
    for (const h of hazards) {
      if (!h.dead && h.canDamage()) {
        const hObj = { x: h.x, y: h.y, radius: h.radius }
        if (verificarColisao(hObj, player)) {
          player.hp -= h.damage
          player.outOfCombatTimer = 0
          criarNumeroDano(player.x, player.y, h.damage, 'red')
          aplicarEfeitoDeStatus(player, h.type)
        }
        for (const e of enemies) {
          if (!e.dead && verificarColisao(hObj, e)) {
            e.takeDamage(h.damage, 'environment')
            e.outOfCombatTimer = 0
            criarNumeroDano(e.x, e.y, h.damage, 'white')
            aplicarEfeitoDeStatus(e, h.type)
          }
        }
      }
    }
  }
}
