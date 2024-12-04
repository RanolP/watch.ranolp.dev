import {
  defineConfig,
  presetAttributify,
  presetUno,
  transformerAttributifyJsx,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  transformers: [transformerAttributifyJsx(), transformerVariantGroup()],
});
