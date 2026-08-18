import './styles/style.css'
import Game from './game/Game.js'
import {BUILD_VERSION, PACKAGE_VERSION } from './game/generatedAssets/buildMeta.js'

console.log(`%cBuild: ${BUILD_VERSION}\nVersion: ${PACKAGE_VERSION}`, 'color: #A31E29')



window.createGame = async (adapter, isTest) => {
  const game = new Game(adapter)
  await game.init()
  
  if (isTest) {
    // only local ip, or localhost
    window.__PIXI_DEVTOOLS__ = {app: game.app,}
  }
  
  const canvas = game.app.canvas
  canvas.addEventListener('pointerup', e => e.preventDefault())
  canvas.addEventListener('pointermove', e => e.preventDefault())
  
  canvas.addEventListener('dblclick', e => e.preventDefault())
  canvas.addEventListener('contextmenu', e => e.preventDefault())
  
  canvas.addEventListener('gesturestart', e => e.preventDefault())
  canvas.addEventListener('gesturechange', e => e.preventDefault())
  canvas.addEventListener('gestureend', e => e.preventDefault())
  
}
