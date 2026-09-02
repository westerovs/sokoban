/**
 * Описывает JavaScript-преобразования между XSB и внутренними картами игры.
 */

type XsbLevel = {
  map: string[]
  metadata: Record<string, string>
}

// Разбирает текст XSB в список уровней.
declare const parseXsb: (text: string, sourceLabel?: string) => XsbLevel[]

// Собирает уровни обратно в текст XSB.
declare const serializeXsb: (levels: XsbLevel[]) => string

// Преобразует стандартную XSB-карту во внутренний формат.
declare const toRuntimeMap: (standardMap: string[]) => string[]

// Преобразует внутреннюю карту в стандартный формат XSB.
declare const toStandardMap: (runtimeMap: string[]) => string[]

export {
  parseXsb,
  serializeXsb,
  toRuntimeMap,
  toStandardMap,
}

export type {
  XsbLevel,
}
