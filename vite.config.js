import {defineConfig} from 'vite';
export default defineConfig(({mode})=>({
  base:'./',
  build:{chunkSizeWarningLimit:1600,sourcemap:false},
  plugins:mode==='poki'?[{
    name:'poki-sdk',
    transformIndexHtml(html){return {html,tags:[{tag:'script',attrs:{src:'https://game-cdn.poki.com/scripts/v2/poki-sdk.js',defer:true},injectTo:'head'}]};}
  }]:[]
}));
