import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    base: './',
    
    server: {
        port: 3000,
        open: false
    },
    
    build: {
        target: 'esnext',
        outDir: 'dist',
        minify: false,
        rollupOptions: {
            plugins: [
                visualizer({
                    open: true,
                    filename: 'stats.html'
                })
            ]
        }
    }
});
