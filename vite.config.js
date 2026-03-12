import tailwindcss from '@tailwindcss/vite'

export default {
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}
