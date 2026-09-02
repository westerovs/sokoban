import type {Howl} from 'howler'

// Описывает ресурсы и коллекции звуков, используемые аудиосистемой.

type AudioAsset = {
  alias: string
  src: string | string[]
}

type PreloadAudioList = {
  START_MUSIC: AudioAsset[]
  SFX: AudioAsset[]
}

type SoundList = Howl[] & Record<string, Howl>

export type {AudioAsset, PreloadAudioList, SoundList}
