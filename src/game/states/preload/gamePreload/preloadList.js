import {LIVE_OPS_ID} from '../../../components/liveOpsController/LiveOpsController.js'
import Locator from '../../../engine/Locator.ts'
import {ASSETS_URL, GAME_NAMES} from '../../../gameConfig/constants.js'
import {GAME_NAME} from '../../../generatedAssets/buildMeta.js'

const createPreloadList = () => {
  const basePath = ASSETS_URL.local
  const isHotel = GAME_NAME === GAME_NAMES.hotel
  const secondaryFontName = isHotel ? 'primaryFont' : 'secondaryFont'
  const locationAssetNames = ['antarctica', 'factory', 'forest', 'garden', 'garden2', 'mine']

  const createBackgroundAsset = () => {
    const isNewYear = Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)
    const src = isNewYear ? `${basePath}assets/_events/newYear/images/startScreen.webp` : `${basePath}assets/images/startScreen.webp`

    return {alias: 'startScreen', src}
  }

  const locationAssets = locationAssetNames.flatMap((name) => [
    {alias: name, src: `${basePath}assets/levels/backgrounds/${name}.webp`},
    {alias: `card-${name}`, src: `${basePath}assets/levels/level-cards/card-${name}.webp`},
  ])

  return {
    bundles: [
      {
        name: 'gameScreen',
        assets: [
          createBackgroundAsset(),
          ...locationAssets,
          // главный шрифт
          {alias: 'primaryFont', src: `${basePath}assets/fonts/primaryFont.woff2`},
        ],
      },
      // второстепенный шрифт, он идёт через ленивую загрузку, т.к встречается только в уровне
      {
        name: 'secondaryFont',
        assets: [{alias: 'secondaryFont', src: `${basePath}assets/fonts/${secondaryFontName}.woff2`}],
      },
    ],
  }
}

export {createPreloadList}
