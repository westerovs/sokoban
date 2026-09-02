import type {Container} from 'pixi.js'

// Настраивает объекты PixiJS для взаимодействия с указателем.

type InteractiveOptions = {
  isButton?: boolean
}

// Добавляет объекту режим взаимодействия и курсор кнопки.
const applyInteractive = <T extends Container>(target: T, {isButton = false}: InteractiveOptions = {}) => {
  const props: {eventMode: 'static'; cursor: string; type?: string} = {
    eventMode: 'static',
    cursor: 'pointer',
  }

  if (isButton) props.type = 'button'

  return Object.assign(target, props)
}

export {applyInteractive}
