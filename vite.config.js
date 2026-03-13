import { defineConfig } from 'vite';

export default defineConfig({
    // Se você for hospedar no GitHub Pages (ex: seunome.github.io/meu-jogo), 
    // mude a base para '/meu-jogo/'. Por padrão, deixamos './'
    base: './',
    
    server: {
        port: 3000, // Porta fixa para facilitar
        open: true  // Abre o navegador automaticamente quando iniciar
    },
    
    build: {
        target: 'esnext', // Permite usar features modernas de JS sem medo
        outDir: 'dist'    // Pasta onde o jogo final será cuspido após o build
    }
});
