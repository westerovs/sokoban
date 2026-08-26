const CONFETTI_SETTINGS = Object.freeze({
  enabled: true,
  revealDuration: 0.3,
  emissionDuration: 3.3,
  gravity: 820,
  spawnHeight: 16,
  colors: Object.freeze([0xf94144, 0xf8961e, 0xf9c74f, 0x90be6d, 0x43aa8b, 0x577590, 0x9b5de5, 0xf15bb5]),
  size: Object.freeze({min: 10, max: 22}),
  velocityX: Object.freeze({min: -110, max: 110}),
  velocityY: Object.freeze({min: 80, max: 210}),
  spin: Object.freeze({min: 2.2, max: 6.4}),
  sway: Object.freeze({amplitude: 55, frequency: 4}),
  desktop: Object.freeze({frequency: 0.025, particlesPerWave: 3, maxParticles: 260}),
  mobile: Object.freeze({frequency: 0.045, particlesPerWave: 2, maxParticles: 110}),
})

export {CONFETTI_SETTINGS}
