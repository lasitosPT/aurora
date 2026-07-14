import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', three: 'src/three.ts', pdf: 'src/pdf/viewer.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
})
