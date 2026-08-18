import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import MathTools from '../../utils/MathTools.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'


// ------ animate
// Цифры обновляются динамически
// 1 этап - поле бонус - монетки вылетают из 0 и там остается то число, которое начисляется
// 2 этап - бонусные монетки перелетают в счет награды уровня
// 3 этап - монетки из воздуха появляются и залетают в счёт игрока, увеличивая его
export default class LevelRewardAnimator {
  #view
  #rowBonus
  #textBonusCoin
  #bonusCoin
  #rowReward
  
  #generatedCoins = null
  #difficultyData
  #totalLevelSum = 0
  #flyDuration = 0.2
  #eachDelay = 0.1
  
  constructor(view) {
    this.#view = view
    this.#rowBonus = view.rowBonus
    this.#rowReward = view.rowReward
    
    this.#textBonusCoin = this.#rowBonus.getChildByLabel('textBonusCoin')
    this.#bonusCoin = this.#rowBonus.getChildByLabel('bonusCoin')
    
    this.#difficultyData = view.difficultyData
  }
  
  animate = async () => {
    const {reward} = this.#difficultyData
    this.#totalLevelSum = reward + this.#view.levelBonusValue
    
    if (!reward || reward === 0) {
      await this.#runNoBonusAction()
      return
    }

    
    await this.#runStep1()
    await this.#runStep2()
    await this.#runStep3()
  }
  
  multiplyReward = async () => {
    this.#totalLevelSum *= 2
    // 1) переместить монетки в шаг 2
    const coinBonusSum = this.#rowReward.getChildByLabel('coinBonusSum')
    const textSumReward = this.#rowReward.getChildByLabel('textSumReward')
    const textTotalCoins = this.#rowReward.getChildByLabel('textTotalCoins')
    const coinTotalCoins = this.#rowReward.getChildByLabel('coinTotalCoins')
    
    const startPos = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)
    const endPos = GameUtils.getLocalPositionVarB(coinTotalCoins, this.#view)
    
    await gsap.timeline()
      .set(this.#generatedCoins, {
        x: () => startPos.x + this.#getRandomPosition().rx,
        y: () => startPos.y + this.#getRandomPosition().ry,
        duration: this.#flyDuration,
        alpha: 0,
        visible: true
      })
      .to(this.#generatedCoins, {
        x: startPos.x, y: startPos.y, alpha: 1, stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textSumReward, {setIconPlus: true})
            Locator.soundManager.play('sfx_coin')
          }
        }
      })
      .to(this.#generatedCoins, {
        x: endPos.x, y: endPos.y, duration: this.#flyDuration, stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textTotalCoins)
            Locator.soundManager.play('sfx_coin')
          }
        }
      })
  }
  
  #runNoBonusAction = async () => {
    const coinBonusSum = this.#rowReward.getChildByLabel('coinBonusSum')
    const startPos = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)
    
    this.#totalLevelSum = this.#view.levelBonusValue
    this.#createCoins(this.#totalLevelSum, startPos.x, startPos.y)
    await this.#runStep3()
  }
  
  #runStep1 = async () => {
    await this.#createAndFly(this.#bonusCoin)
  }
  
  #runStep2 = async () => {
    const textSumReward = this.#rowReward.getChildByLabel('textSumReward')
    const coinBonusSum = this.#rowReward.getChildByLabel('coinBonusSum')
    
    if (this.#generatedCoins) {
      const {x, y} = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)
      
      await gsap.timeline()
        .to(this.#generatedCoins, {
          x: x, y: y, stagger: {
            each: this.#eachDelay,
            onComplete: () => {
              this.#updateTextValue(this.#textBonusCoin, {increase: false})
              this.#updateTextValue(textSumReward, {setIconPlus: true})
              Locator.soundManager.play('sfx_coin')
            }
          }
        })
        .set(this.#generatedCoins, {visible: false})
    }
  }
  
  #runStep3 = async () => {
    const textTotalCoins = this.#rowReward.getChildByLabel('textTotalCoins')
    const coinTotalCoins = this.#rowReward.getChildByLabel('coinTotalCoins')
    
    const {x, y} = GameUtils.getLocalPositionVarB(coinTotalCoins, this.#view)
    const coins = this.#generatedCoins
    
    if (coins.length < this.#totalLevelSum) {
      await this.#createAdditionalCoins(coins, x, y)
    }

    await gsap.timeline()
      .set(coins, {
        x: () => x + this.#getRandomPosition().rx,
        y: () => y + this.#getRandomPosition().ry,
        duration: this.#flyDuration,
        alpha: 0,
        visible: true
      })
      .to(coins, {
        x: x, y, alpha: 1, stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textTotalCoins)
            Locator.soundManager.play('sfx_coin')
          }
        }
      })
      .set(coins, {visible: false})
  }
  
  #createAndFly = async (target) => {
    const {reward} = this.#difficultyData
    const {x, y} = GameUtils.getLocalPositionVarB(target, this.#view)
    let coins = this.#createCoins(reward, x, y)
    
    const flyProps = {
      x: (i, coin) => x + coin._randomPos.rx,
      y: (i, coin) => y + coin._randomPos.ry,
      duration: this.#flyDuration, ease: 'back.out', stagger: {
        each: this.#eachDelay,
        from: 'end',
        onComplete: () => {
          this.#updateTextValue(this.#textBonusCoin)
          Locator.soundManager.play('sfx_coin')
        }
      }
    }
    
    await gsap.timeline()
      .to(coins, {duration: this.#flyDuration, stagger: 0.1})
      .to(coins, flyProps, '<')
  }
  
  #updateTextValue = (textElement, {increase = true, setIconPlus = false} = {}) => {
    let value = +textElement.text
    value += increase ? 1 : -1
    
    if (setIconPlus) {
      textElement.text = `+${value}`
      return
    }
    textElement.text = value
  }
  
  #createCoins = (maxCoins, x, y) => {
    this.#generatedCoins = []
    
    for (let i = 0; i < maxCoins; i++) {
      const coin = GameUtils.createSprite('coin', {name, scale: 0.64})
      coin.position.set(x, y)
      
      const {rx, ry} = MathTools.getRandomPosition({
        maxX: 100,
        minY: 40,
        maxY: 150,
        forceYMinus: true
      })
      coin._randomPos = {rx, ry}
      
      this.#view.addChild(coin)
      this.#generatedCoins.push(coin)
    }
    
    return this.#generatedCoins
  }
  
  // если на 3‑м этапе получили условные 10 монеток за бонус сложности, то нужно создать ещё 10 - число levelBonusValue
  // для того, что бы летели уже 20 монеток
  #createAdditionalCoins = (coins, x, y) => {
    const promises = []
    
    for (let i = coins.length; i < this.#totalLevelSum; i++) {
      promises.push(
        Promise.resolve().then(() => {
          const coin = GameUtils.createSprite('coin', { name, scale: 0.64 })
          coin.position.set(x, y)
          this.#view.addChild(coin)
          this.#generatedCoins.push(coin)
          return coin
        })
      )
    }
    
    return Promise.all(promises)
  }
  
  #getRandomPosition = () => {
    const {rx, ry} = MathTools.getRandomPosition({
      minX: -150,
      maxX: 150,
      minY: -150,
      maxY: 150,
    })
    
    return {rx, ry}
  }
}
