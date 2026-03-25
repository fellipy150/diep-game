import { MoveController } from './MoveController.js'
import { AimController } from './AimController.js'
import { SwapController } from './SwapController.js'

class InputManager {
  constructor() {
    const baseMove = document.getElementById('joystick-move')
    const stickMove = document.getElementById('stick-move')
    const baseAim = document.getElementById('joystick-aim')
    const stickAim = document.getElementById('stick-aim')
    this.moveCtrl = new MoveController(baseMove, stickMove)
    this.aimCtrl = new AimController(baseAim, stickAim)
    this.swapCtrl = new SwapController()
    this.setupGlobalPrevention()
  }
  get move() {
    return this.moveCtrl.value
  }
  get aim() {
    return this.aimCtrl.value
  }
  get lastAim() {
    return this.aimCtrl.lastAim
  }
  set lastAim(val) {
    this.aimCtrl.lastAim = val
  }
  get isAiming() {
    return this.aimCtrl.isAiming
  }
  get isTap() {
    return this.aimCtrl.isTap
  }
  get fireReleased() {
    return this.aimCtrl.fireReleased
  }
  set fireReleased(val) {
    this.aimCtrl.fireReleased = val
  }
  get fireSwap() {
    return this.swapCtrl.value
  }
  set fireSwap(val) {
    this.swapCtrl.value = val
  }
  setupGlobalPrevention() {
    const handlePrevention = e => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        if (e.cancelable) e.preventDefault()
      }
    }
    document.addEventListener('touchstart', handlePrevention, {
      passive: false,
    })
    document.addEventListener('touchmove', handlePrevention, { passive: false })
  }
}
export const input = new InputManager()
