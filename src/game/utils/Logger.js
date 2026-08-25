export const MODULES = {
  SDK: 'SDK',
  STORAGE: 'STORAGE',
  Metrika: 'Metrika',
  GamePreload: 'GamePreload',
  LevelPreload: 'LevelPreload',
  LOAD_ACTION: 'LOAD_ACTION',
  Config: 'config',
  SOUND_MANAGER: 'SOUND_MANAGER',
  DestroyMessage: 'DestroyMessage',
}

const COLORS = {
  [MODULES.SDK]: '#28FF5A',
  [MODULES.STORAGE]: '#00DEFE',
  [MODULES.Metrika]: '#BBFE64',
  [MODULES.GamePreload]: 'yellow',
  [MODULES.LevelPreload]: 'orange',
  [MODULES.Config]: '#3DB4FB',
  [MODULES.SOUND_MANAGER]: '#08FE00',
  [MODULES.DestroyMessage]: '#FF0000',
  [MODULES.LOAD_ACTION]: '#08FE00',
  
  // системные/общие
  default: '#44A0A3',
  warning: 'tomato',
  error: 'red',
  green: '#08FE00',
}

export const LOG_STATUS = {
  IS_DISABLED_LOG: true,
}


const setColor = (moduleName) => {
  return COLORS[moduleName] || COLORS.default
}

const enabledModules = new Set()
enabledModules.add(MODULES.Config)
// enabledModules.add(MODULES.Metrika)
// enabledModules.add(MODULES.SDK)
// enabledModules.add(MODULES.STORAGE)
// enabledModules.add(MODULES.GamePreload)
// enabledModules.add(MODULES.LevelPreload)
// enabledModules.add(MODULES.LOAD_ACTION)
// enabledModules.add(MODULES.SOUND_MANAGER)
// enabledModules.add(MODULES.DestroyMessage)

export class Logger {
  static log(moduleName, message, ...args) {
    if (LOG_STATUS.IS_DISABLED_LOG) return
    
    if (enabledModules.has(moduleName)) {
      console.log(`%c[${moduleName}]`, `color: ${setColor(moduleName)}`, message, ...args)
      return
    }
    
    if (Object.values(MODULES).includes(moduleName)) return
    
    console.log(`%c[Logger]`, `color: ${setColor(moduleName)}`, moduleName ?? '', message, ...args)
  }
  
  static warn(moduleName, message, ...args) {
    if (LOG_STATUS.IS_DISABLED_LOG) return
    
    if (enabledModules.has(moduleName)) {
      console.warn(`[${moduleName}]`, message, ...args)
      return
    }
    
    if (Object.values(MODULES).includes(moduleName)) return
    
    console.log(`%c[Logger]`, `color: ${COLORS.warning}`, message, ...args)
  }
}

