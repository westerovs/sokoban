import {defaultFilterVert, Filter, GlProgram} from 'pixi.js'

const fragment = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float amount; // 0 — цветное, 1 — чб

  void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 mixColor = mix(color.rgb, vec3(gray), amount);
    finalColor = vec4(mixColor, color.a);
  }
`

export default class GrayscaleFilter extends Filter {
  #amount = 1
  
  constructor(amount = 1) {
    super({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment,
      }),
      resources: {
        grayscaleUniforms: {
          amount: {value: amount, type: 'f32'},
        },
      },
    })
    this.name = 'grayscaleFilter'
    this.#amount = amount
  }
  
  get amount() {
    return this.resources.grayscaleUniforms.uniforms.amount
  }
  
  set amount(value) {
    this.#amount = value
    this.resources.grayscaleUniforms.uniforms.amount = value
  }
}
