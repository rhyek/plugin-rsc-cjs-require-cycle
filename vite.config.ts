import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [rsc(), react()],
  environments: {
    rsc: {
      resolve: {
        // Bundle these instead of letting Node require() them, so in dev they go
        // through plugin-rsc's CJS -> ESM transform. EXTERNAL=1 turns that off.
        noExternal: process.env.EXTERNAL ? [] : ['cjs-cycle', 'semver'],
      },
      build: {
        rollupOptions: {
          input: { index: './src/framework/entry.rsc.tsx' },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: { index: './src/framework/entry.ssr.tsx' },
        },
      },
    },
    client: {
      build: {
        rollupOptions: {
          input: { index: './src/framework/entry.browser.tsx' },
        },
      },
    },
  },
})
