declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.wav' {
  const src: string
  export default src
}

declare module '*.atlas' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_PLATFORM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
