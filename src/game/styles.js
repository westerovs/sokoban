import {GAME_NAMES} from './gameConfig/constants.js'
import {GAME_NAME} from './generatedAssets/buildMeta.js'

// todo подумать, мб сделать в настройках выбор темы интерфейса
const GAME_STYLES = {
  fadeHalfAlpha: 0.65,
}

const FONT_COLORS = {
  mainFont: 0xF4D884,
  secondFont: 0x373751,
  accentFont: 0x6E7F80,
  blackColor: 0x000000,
  
  getIntroSpeechBubbleColor: () => {
    if (GAME_NAME === GAME_NAMES.adventure) return 0x000000
    if (GAME_NAME === GAME_NAMES.detectiveGirl) return 0xFFFFFF
    
    return FONT_COLORS.mainFont
  }
}

const primaryFontStyle = {
  fill: FONT_COLORS.blackColor,
  fontFamily: 'primaryFont',
  fontWeight: '800',
  fontSize: 36,
}

const COMPASS_TIMER_TEXT_COLOR = () => {
  return 0x471F1F
}

const getPopupColors = () => {
  return {
    body: 0x005462,
    border: 0x8DA399
  }
}
const popupColors = getPopupColors()

const getLeaderAndStoreColors = () => {
  return {
    body: 0x2E1313,
    border: 0x8B814F
  }
}
const leaderAndStoreColors = getLeaderAndStoreColors()

const getSKinStoreColors = () => {
  return {
    body: 0x2E1313,
    border: 0xE7C091
  }
}
const skinStoreColors = getSKinStoreColors()

const getRewardWindowStyles = () => {
  return {
    rowTextColor: 0x5A2713,
    headerTextColor: 0x5A2713,
    headerTextOffsetY: -5,
  }
}
const rewardWindowStyles = getRewardWindowStyles()

export {
  FONT_COLORS,
  popupColors,
  leaderAndStoreColors,
  rewardWindowStyles,
  skinStoreColors,
  COMPASS_TIMER_TEXT_COLOR,
  primaryFontStyle,
  GAME_STYLES,
}
