import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Relative base so the build works both at the project-pages URL
// (lasitosPT.github.io/aurora/) and at the custom domain root.
export default defineConfig({
  base: './',
  resolve: {
    // Import the library straight from source and let Vite bundle gsap/three.
    // Order matters: the more specific alias must come first.
    alias: [
      { find: 'aurora/three', replacement: resolve(__dirname, '../src/three.ts') },
      { find: 'aurora', replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
})
