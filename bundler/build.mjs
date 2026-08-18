/**
 * Production-сборщик одной или нескольких платформ.
 *
 * Для каждой платформы создаётся отдельная Vite-конфигурация: alias
 * `@platform-service` указывает на нужный `services/<platform>/Service.js`,
 * код попадает в `dist/<PLATFORM>_<GAME>`, после чего туда копируются AssetPack-ассеты.
 *
 * Примеры:
 * `npm run build`                        — PLATFORMS_TO_BUILD из platformConfig;
 * `npm run build -- --platform=yandex` — одна платформа;
 * `npm run build -- --platforms=vk,ok` — несколько платформ;
 * `npm run build -- all`               — все production-платформы.
 */
import {createRequire} from 'node:module'
import {rmSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {build as viteBuild} from 'vite'
import {createViteConfig} from '../vite.config.mjs'
import {
  PLATFORMS_TO_BUILD,
  resolveBuildPlatforms
} from './platformConfig.mjs'

const require = createRequire(import.meta.url)
const {copyAssetsToBuild} = require('./utils/assetsCopy.js')
const distDir = fileURLToPath(new URL('../dist', import.meta.url))

/** Поддерживает именованные аргументы и короткую позиционную форму. Неизвестные
 * флаги отклоняются сразу, чтобы не собрать платформу по умолчанию случайно. */
const parsePlatformNames = (args) => {
  const names = []

  for (const argument of args) {
    if (argument.startsWith('--platform=')) {
      names.push(argument.slice('--platform='.length))
      continue
    }

    if (argument.startsWith('--platforms=')) {
      names.push(...argument.slice('--platforms='.length).split(','))
      continue
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown build argument: ${argument}`)
    }

    names.push(...argument.split(','))
  }

  const filteredNames = names.map((name) => name.trim()).filter(Boolean)
  return filteredNames.length
    ? filteredNames
    : PLATFORMS_TO_BUILD.map(({name}) => name)
}

const buildPlatform = async (platform) => {
  console.log(`\n----- Vite build: platform=${platform.name}, output=${platform.outputDir} -----`)

  /** Dev и production используют один createViteConfig, поэтому HTML и alias
   * платформенного сервиса не расходятся между режимами. */
  await viteBuild(createViteConfig({
    platformName: platform.name,
    command: 'build'
  }))

  /** Vite собирает приложение, а большие игровые ресурсы переносятся отдельно
   * с учётом local/remote правил конкретной площадки. */
  copyAssetsToBuild(platform)
}

const main = async () => {
  const requestedNames = parsePlatformNames(process.argv.slice(2))
  const platforms = resolveBuildPlatforms(requestedNames)

  /** Очищаем общий dist только после успешной проверки аргументов. Это важно:
   * ошибочная команда не должна удалять результаты предыдущей сборки. */
  rmSync(distDir, {recursive: true, force: true})
  console.log(`Build output cleared: ${distDir}`)

  console.log(`Build platforms: ${platforms.map(({name}) => name).join(', ')}`)

  // outDir у платформ разные, поэтому независимые сборки можно вести параллельно.
  await Promise.all(platforms.map(buildPlatform))

  console.log(`\nBuild completed: ${platforms.map(({outputDir}) => outputDir).join(', ')}`)
}

// Любая ошибка платформы делает общий npm script неуспешным для CI/WebStorm.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
