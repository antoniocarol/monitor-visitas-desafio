import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify('https://tatico.spocws.icu/teste/followups_e5aa')
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/__tests__/setup.ts'],
    include: [
      'app/__tests__/**/*.test.{ts,tsx}',     // Centralizados (utils, integração)
      'app/components/**/*.test.{ts,tsx}',    // Colocados - componentes
      'app/hooks/**/*.test.{ts,tsx}'          // Colocados - hooks
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/__tests__/**',
        'app/types/**',
        'app/layout.tsx',
        'app/globals.css',
        'app/**/*.test.{ts,tsx}'  // Exclui arquivos de teste da cobertura
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app')
    }
  }
})
