import {defaultFilterVert, Filter, GlProgram} from 'pixi.js'

// Реализует регулируемый фильтр затемнения изображения.

const fragment = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float darkness;

  void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    color.rgb *= (1.0 - darkness);
    finalColor = color;
  }
`

export default class DarkenFilter extends Filter {
  #darkness = 0

  // Создаёт фильтр с заданной интенсивностью затемнения.
  constructor(darkness = 0) {
    super({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment,
      }),
      resources: {
        darkenUniforms: {
          darkness: {value: darkness, type: 'f32'},
        },
      },
    })
    this.#darkness = darkness
  }

  // Возвращает текущую интенсивность затемнения.
  get darkness() {
    return this.resources.darkenUniforms.uniforms.darkness
  }

  // Обновляет интенсивность затемнения.
  set darkness(value) {
    this.#darkness = value
    this.resources.darkenUniforms.uniforms.darkness = value
  }
}
