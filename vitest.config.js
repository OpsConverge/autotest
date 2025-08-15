import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Exclude API tests that require backend
      'src/test/api-supertest/**',
      'src/test/integration-supertest/**',
      'src/test/e2e-selenium/**',
      'src/test/api-karate/**',
      'src/test/api-restassured/**',
      'tests/performance/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/',
        '**/*.config.js',
        '**/*.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
