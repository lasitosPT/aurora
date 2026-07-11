import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Relative base so the build works both at the project-pages URL
// (lasitosPT.github.io/aurora/) and at the custom domain root.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        components: resolve(__dirname, 'components.html'),
      },
    },
  },
  resolve: {
    // Import the library straight from source and let Vite bundle gsap/three.
    // Order matters: the more specific alias must come first. gsap/three are
    // pinned to this app's node_modules because the aliased library source lives
    // outside site/, so its bare imports would otherwise not resolve in CI.
    alias: [
      { find: 'aurora/three', replacement: resolve(__dirname, '../src/three.ts') },
      { find: 'aurora', replacement: resolve(__dirname, '../src/index.ts') },
      { find: /^gsap$/, replacement: resolve(__dirname, 'node_modules/gsap') },
      { find: /^three$/, replacement: resolve(__dirname, 'node_modules/three') },
    ],
  },
})
