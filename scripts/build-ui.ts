import {build} from 'esbuild';
import {mkdir,copyFile,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));
await mkdir('packages/ui/dist',{recursive:true});
for(const format of ['esm','cjs'] as const)await build({absWorkingDir:process.cwd(),entryPoints:['packages/ui/src/index.ts'],outfile:'packages/ui/dist/index.'+(format==='esm'?'js':'cjs'),bundle:true,format,platform:'neutral',target:'es2022',jsx:'automatic',external:['react','react/*'],minify:false});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','packages/ui/tsconfig.json'],{stdio:'inherit'});
await copyFile('packages/ui/src/styles.css','packages/ui/dist/styles.css');
if(!process.argv.includes('--library')){
 await rm('public',{recursive:true,force:true});await mkdir('public/ui',{recursive:true});
 const bundle=await build({absWorkingDir:process.cwd(),entryPoints:['web/main.tsx'],outdir:'public/ui',entryNames:'[name]-[hash]',chunkNames:'chunk-[hash]',splitting:true,metafile:true,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},loader:{'.css':'css'},legalComments:'eof'});
 const entry=Object.entries(bundle.metafile.outputs).find(([,value])=>value.entryPoint==='web/main.tsx')!;
 const assets={script:'/'+entry[0].replace(/^public\//,''),style:'/'+entry[1].cssBundle!.replace(/^public\//,''),preloads:entry[1].imports.filter(i=>i.kind==='import-statement').map(i=>'/'+i.path.replace(/^public\//,''))};
 await mkdir('src/ui',{recursive:true});await writeFile('src/ui/manifest.ts','export const assets='+JSON.stringify(assets)+';\n');
 await writeFile('public/_headers','/ui/*\n  X-Content-Type-Options: nosniff\n');
}
