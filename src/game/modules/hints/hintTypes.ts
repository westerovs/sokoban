import type {gsap} from 'gsap'
import type {Container} from 'pixi.js'
import type GrayscaleFilter from '../../utils/filters/GrayscaleFilter.js'

// Описывает общие типы кнопок и ссылок подсистемы подсказок.

type HintButtonName = 'hintCompass' | 'hintDarts' | 'hints'

type HintButton = Container & {
  label: string
  grayscaleFilter?: GrayscaleFilter | null
  isDisabled?: boolean
  plusTimeLine?: gsap.core.Timeline | null
}

type HintRefs = Record<string, Container>

export type {
  HintButton,
  HintButtonName,
  HintRefs,
}
