import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
var require = createRequire(import.meta.url);
var module = { exports: {} };

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
};
