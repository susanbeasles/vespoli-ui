import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));await mkdir('work',{recursive:true});const consumer=await mkdtemp(resolve('work/consumer-'));
try{
 const result=JSON.parse(execFileSync('npm',['pack','--workspace','vespoli-ui','--json'],{encoding:'utf8',stdio:['ignore','pipe','inherit']}))[0];
 if(result.files.some((file:{path:string})=>!(/^(dist\/|README.md$|LICENSE$|package.json$)/.test(file.path))))throw Error('Unexpected file in public package');
 const tar=resolve(result.filename);await writeFile(resolve(consumer,'package.json'),JSON.stringify({name:'package-consumer',version:'1.0.0',private:true,type:'module'}));
 execFileSync('npm',['install','--ignore-scripts','--package-lock=false',tar,'react@19.3.1','@types/react'],{cwd:consumer,stdio:'pipe'});
 await writeFile(resolve(consumer,'consumer.tsx'),`import {Table,TextField,Properties} from 'vespoli-ui';\nconst rows=[{id:'one',name:'Example'}];\nconst view=<div className="vui"><TextField id="query" label="Search" value="hello" onChange={()=>{}}/><Properties items={[{label:'Name',value:'Example'}]}/><Table caption="Records" rows={rows} rowKey={r=>r.id} columns={[{id:'name',header:'Name',cell:r=>r.name}]}/></div>;\n// @ts-expect-error The public table must infer its row type and reject missing fields.\nconst invalid=<Table caption="Records" rows={rows} rowKey={r=>r.missing} columns={[]}/>;\nconsole.log(view);\n`);
 execFileSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--jsx','react-jsx','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',resolve(consumer,'consumer.tsx')],{stdio:'inherit'});
 execFileSync(process.execPath,['--input-type=module','-e',"import{Button,Table}from'vespoli-ui';if(typeof Button!=='function'||typeof Table!=='function')process.exit(1);import.meta.resolve('vespoli-ui/styles.css');"],{cwd:consumer,stdio:'inherit'});
 execFileSync(process.execPath,['-e',"const{Button,Table}=require('vespoli-ui');if(typeof Button!=='function'||typeof Table!=='function')process.exit(1)"],{cwd:consumer,stdio:'inherit'});
 console.log(JSON.stringify({package:result.name,version:result.version,tarball:result.filename,bytes:result.size,unpacked:result.unpackedSize,files:result.files.length,esm:true,cjs:true,types:true,css:true}));
}finally{await rm(consumer,{recursive:true,force:true});}
