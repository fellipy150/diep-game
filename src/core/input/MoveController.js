import { Joystick } from './Joystick.js'
import { JOYSTICK_MAX_RADIUS, JOYSTICK_DEADZONE } from './Constants.js'

export class MoveController {
  constructor(baseEl, stickEl) {
    this.joy = new Joystick(baseEl, stickEl, JOYSTICK_MAX_RADIUS)
    this.value = { x: 0, y: 0 }
    if (baseEl && stickEl) {
      requestAnimationFrame(() => this.joy.init())
      this.initEvents()
    }
  }
  initEvents() {
    this.joy.base.addEventListener(
      'touchstart',
      e => {
        e.preventDefault()
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (this.joy.touchId === null) {
            this.joy.activate(touch.clientX, touch.clientY, touch.identifier)
          }
        }
      },
      { passive: false }
    )
    document.addEventListener(
      'touchmove',
      e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (touch.identifier === this.joy.touchId) {
            const output = this.joy.update(touch.clientX, touch.clientY)
            if (output.distance > JOYSTICK_DEADZONE) {
              this.value.x = output.x
              this.value.y = output.y
            } else {
              this.value.x = 0
              this.value.y = 0
            }
          }
        }
      },
      { passive: false }
    )
    const handleEnd = e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joy.touchId) {
          this.joy.reset()
          this.value.x = 0
          this.value.y = 0
        }
      }
    }
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('touchcancel', handleEnd)
  }
}
