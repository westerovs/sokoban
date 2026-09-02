// Описывает данные одной промокарточки.

type PromoData = {
  id: string
  texture: string
  readonly header: string
  readonly description: string
}

type PromoDataCatalog = Record<string, PromoData>

export type {
  PromoData,
  PromoDataCatalog,
}
