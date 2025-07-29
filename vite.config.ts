
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A configuração 'define' foi removida.
  // O Vite expõe automaticamente as variáveis de ambiente prefixadas com 'VITE_'
  // para 'import.meta.env', que agora é usado em todo o aplicativo.
  // Isso simplifica a configuração e evita confusão.
})
