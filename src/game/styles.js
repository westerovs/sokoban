import {GAME_NAMES} from './gameConfig/constants.js'
import {GAME_NAME} from './generatedAssets/buildMeta.js'

// todo подумать, мб сделать в настройках выбор темы интерфейса
const GAME_STYLES = {
  fadeHalfAlpha: 0.65,
}

const FONT_COLORS = {
  mainFont: 0xf4d884,
  secondFont: 0x373751,
  accentFont: 0x6e7f80,
  blackColor: 0x000000,

  getIntroSpeechBubbleColor: () => {
    if (GAME_NAME === GAME_NAMES.adventure) return 0x000000
    if (GAME_NAME === GAME_NAMES.detectiveGirl) return 0xffffff

    return FONT_COLORS.mainFont
  },
}

const primaryFontStyle = {
  fill: FONT_COLORS.blackColor,
  fontFamily: 'primaryFont',
  fontWeight: '800',
  fontSize: 36,
}

const COMPASS_TIMER_TEXT_COLOR = () => {
  return 0x471f1f
}

const getPopupColors = () => {
  return {
    body: 0x005462,
    border: 0x8da399,
  }
}
const popupColors = getPopupColors()

const getLeaderAndStoreColors = () => {
  return {
    body: 0x2e1313,
    border: 0x8b814f,
  }
}
const leaderAndStoreColors = getLeaderAndStoreColors()

const getSKinStoreColors = () => {
  return {
    body: 0x2e1313,
    border: 0xe7c091,
  }
}
const skinStoreColors = getSKinStoreColors()

const getRewardWindowStyles = () => {
  return {
    rowTextColor: 0x5a2713,
    headerTextColor: 0x5a2713,
    headerTextOffsetY: -5,
  }
}
const rewardWindowStyles = getRewardWindowStyles()

export {
  COMPASS_TIMER_TEXT_COLOR,
  FONT_COLORS,
  GAME_STYLES,
  leaderAndStoreColors,
  popupColors,
  primaryFontStyle,
  rewardWindowStyles,
  skinStoreColors,
}
