// Разблокирует AudioContext после первого касания на устройствах iOS.

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

// Создаёт и активирует совместимый браузерный аудиоконтекст.
const antiMuteIOS = (_silencePath?: string) => {
  const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext
  if (!AudioContextClass) return

  const ctx = new AudioContextClass()
  let unlocked = false

  // Воспроизводит пустой буфер для снятия ограничения браузера.
  const unlock = () => {
    if (unlocked) return
    console.log('antiMuteIOS unlock')

    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    unlocked = true
  }

  document.addEventListener('touchstart', unlock)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx.state === 'suspended') ctx.resume()
  })
}

export {antiMuteIOS}
