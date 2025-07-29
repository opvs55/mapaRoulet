
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');
  return {
    plugins: [react()],
    // Disponibiliza as variáveis de ambiente para o código do lado do cliente de forma segura.
    // O Vite substituirá 'process.env.API_KEY' pelo valor da variável de ambiente no momento da compilação.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
