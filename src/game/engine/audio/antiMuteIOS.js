export const antiMuteIOS = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  let unlocked = false

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
