import {build} from 'esbuild';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));await rm('bench/dist',{recursive:true,force:true});await mkdir('bench/dist',{recursive:true});
for(const mode of ['production','profiling'])await build({absWorkingDir:process.cwd(),entryPoints:['bench/fixtures.tsx'],outfile:`bench/dist/${mode}.js`,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,alias:mode==='profiling'?{'react-dom/client':'react-dom/profiling'}:undefined,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
for(const mode of ['production','profiling'])await writeFile(`bench/dist/${mode}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Component benchmark</title><link rel="stylesheet" href="/${mode}.css"><script type="module" src="/${mode}.js"></script></head><body style="margin:0"><div id="fixture"></div></body></html>`);
