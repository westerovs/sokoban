import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {AssetPack} from '@assetpack/core'
import basicSsl from '@vitejs/plugin-basic-ssl'
import {defineConfig, normalizePath} from 'vite'
import assetPackConfig from './.assetpack.mjs'
import {DEFAULT_DEV_PLATFORM, DEV_SERVER_CONFIG, PLATFORMS_TO_BUILD, resolvePlatform} from './bundler/platformConfig.mjs'
import {createSokobanLevelEditorPlugin} from './tools/sokoban-level-editor/vitePlugin.mjs'

/**
 * Настраивает Vite, платформенную HTML-оболочку, локальные инструменты и сборку проекта.
 */

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const viteEntry = '/src/viteEntry.js' // Общая точка входа игры для платформенных HTML-шаблонов
const draftBannerMarkup = '<div id="sokoban-draft-banner" class="sokoban-draft-banner" hidden aria-live="polite">ЧЕРНОВИК</div>' // HTML-индикатор запуска черновика

/** Берём первый внешний IPv4 для удобной ссылки на игру с телефона.
 * Если подходящего интерфейса нет, безопасно возвращаемся к localhost. */
const getNetworkAddress = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .find((item) => item && item.family === 'IPv4' && !item.internal)?.address

/** Преобразует человекочитаемый DEV_SERVER_CONFIG в параметры Vite.
 * Именно здесь формируется URL, который печатается как предпочтительный. */
const resolveDevServer = (platform) => {
  const {access, port, openBrowser} = DEV_SERVER_CONFIG

  if (!['network', 'localhost'].includes(access)) {
    throw new Error(`Unknown DEV_SERVER_CONFIG.access: ${access}`)
  }

  const isNetwork = access === 'network'
  const networkAddress = isNetwork ? getNetworkAddress() : null
  const protocol = platform.https ? 'https' : 'http'
  const browserHost = networkAddress || 'localhost'
  const preferredUrl = `${protocol}://${browserHost}:${port}/`

  return {
    host: isNetwork ? '0.0.0.0' : '127.0.0.1',
    port,
    open: openBrowser ? preferredUrl : false,
    preferredUrl,
  }
}

// Добавляет в платформенную оболочку точку входа и скрытую плашку черновика.
const injectViteEntry = (html) => {
  if (!/<\/body>/i.test(html)) {
    throw new Error('Platform index.html must contain a closing </body> tag')
  }

  const injectedMarkup = `  ${draftBannerMarkup}\n  <script type="module" src="${viteEntry}"></script>\n`
  return html.replace(/<\/body>/i, `${injectedMarkup}</body>`)
}

// Создаёт плагин подстановки HTML-шаблона выбранной платформы.
const createPlatformHtmlPlugin = (platform) => {
  const htmlPath = path.resolve(projectRoot, 'services', platform.serviceDir, 'index.html')

  return {
    name: 'platform-html',
    enforce: 'pre',
    // Добавляет платформенный шаблон в наблюдение dev-сервера.
    configureServer(server) {
      server.watcher.add(htmlPath)
    },
    // Перезагружает страницу при изменении платформенного шаблона.
    handleHotUpdate({file, server}) {
      if (path.resolve(file) === htmlPath) {
        server.ws.send({type: 'full-reload', path: '*'})
        return []
      }
    },
    transformIndexHtml: {
      order: 'pre',
      // Подменяет корневой HTML содержимым выбранной платформы.
      handler(html, context) {
        if (!['/', '/index.html'].includes(context.path)) return html

        const platformHtml = fs.readFileSync(htmlPath, 'utf8')
        return injectViteEntry(platformHtml)
      },
    },
  }
}

// Создаёт dev-плагин фонового наблюдения за исходными ресурсами.
const createAssetPackWatchPlugin = () => {
  let assetPack

  return {
    name: 'assetpack-watch',
    apply: 'serve',
    // Запускает наблюдение AssetPack и останавливает его вместе с сервером.
    configureServer(server) {
      assetPack = new AssetPack(assetPackConfig)
      assetPack.watch().catch((error) => server.config.logger.error(error.stack || error.message))
      server.httpServer?.once('close', () => assetPack.stop())
    },
  }
}

/**
 * Важная особенность: во время production-сборки стандартное копирование public средствами Vite здесь отключено:
 * publicDir: false
 * Вместо него используется собственный assetsCopy.js, который запускается после Vite-сборки из [build.mjs]
 * */
const createViteConfig = ({platformName, command = 'build'} = {}) => {
  const platform = resolvePlatform(platformName)
  const isBuild = command === 'build'
  const devServer = !isBuild ? resolveDevServer(platform) : null

  if (isBuild && !platform.outputDir) {
    throw new Error(`Platform "${platform.name}" is intended only for local development`)
  }

  if (!isBuild) {
    console.log('----- DEV MODE -----')
    console.log(`[dev] Platform: ${platform.name}`)
    console.log(`[dev] Access: ${DEV_SERVER_CONFIG.access}`)
    console.log(`[dev] URL: ${devServer.preferredUrl}`)
    console.log('--------------------' + '\n')
  }

  const config = {
    configFile: false,
    root: projectRoot,
    base: './',
    publicDir: isBuild ? false : path.resolve(projectRoot, 'public'),
    plugins: [
      ...(platform.https ? [basicSsl({name: 'localhost', ttlDays: 365})] : []),
      ...(!isBuild ? [createAssetPackWatchPlugin()] : []),
      ...(!isBuild ? [createSokobanLevelEditorPlugin(projectRoot)] : []),
      createPlatformHtmlPlugin(platform),
    ],
    resolve: {
      alias: {
        '@': normalizePath(path.resolve(projectRoot, 'src')),
        '@platform-service': normalizePath(path.resolve(projectRoot, 'services', platform.serviceDir, 'Service.js')),
      },
    },
    server: {
      /** Переключатель расположен в bundler/platformConfig.mjs:
       * DEV_SERVER_CONFIG.access = 'network' | 'localhost'. */
      host: devServer?.host,
      port: devServer?.port,
      strictPort: false,
      /** false не открывает новую вкладку после каждого рестарта Vite.
       * При openBrowser=true откроется preferred network/localhost URL. */
      open: devServer?.open,
      https: platform.https ? {} : undefined,
    },
    define: {
      'import.meta.env.VITE_PLATFORM_NAME': JSON.stringify(platform.name),
    },
  }

  if (isBuild) {
    config.build = {
      outDir: path.resolve(projectRoot, 'dist', platform.outputDir),
      emptyOutDir: true,
      target: 'es2020',
      modulePreload: {polyfill: false},
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rolldownOptions: {
        treeshake: true,
        output: {
          entryFileNames: 'index-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    }
  }

  return config
}

// Выбирает платформу из режима команды и создаёт итоговую конфигурацию.
const viteConfig = defineConfig(({command, mode}) => {
  const isDefaultMode = mode === 'development' || mode === 'production'
  const platformName =
    command === 'serve' ? (isDefaultMode ? DEFAULT_DEV_PLATFORM : mode) : isDefaultMode ? PLATFORMS_TO_BUILD[0]?.name : mode

  return createViteConfig({platformName, command})
})

export default viteConfig

export {
  createViteConfig,
}
