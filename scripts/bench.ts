import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {platform,arch,cpus} from 'node:os';
import {chromium} from '@playwright/test';
import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import * as UI from '../packages/ui/dist/index.js';
process.chdir(resolve(import.meta.dirname,'..'));
const args=process.argv.slice(2),index=args.indexOf('--out'),out=resolve(index<0?'bench/results':args[index+1]);await mkdir(out,{recursive:true});
const budgets=JSON.parse(await readFile('bench/budgets.json','utf8'));
const pick=args.indexOf('--component'),names=pick<0?Object.keys(UI):[args[pick+1]];
const server=createServer(async(req,res)=>{try{const url=new URL(req.url??'/','http://127.0.0.1:3792');if(!/^\/(production|profiling)\.(html|css|js)$/.test(url.pathname)){res.writeHead(404);res.end();return;}const body=await readFile(resolve('bench/dist','.'+url.pathname));res.writeHead(200,{'Content-Type':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.js')?'text/javascript':'text/html','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(500);res.end();}});
await new Promise<void>(done=>server.listen(3792,'127.0.0.1',done));
const browser=await chromium.launch();let chrome:Awaited<ReturnType<typeof launch>>|undefined;
const results:Record<string,any>={},failures:string[]=[];
const median=(values:number[])=>{if(!values.length||values.some(v=>!Number.isFinite(v)))throw Error('Missing timing samples');const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
const p95=(values:number[])=>{if(!values.length)throw Error('Missing timing samples');return [...values].sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];};
try{
 chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless=new','--no-sandbox','--disable-dev-shm-usage'],logLevel:'silent'});
 for(const name of names){
  const paint:number[]=[],contentful:number[]=[];
  for(let n=0;n<budgets.samples.navigations;n++){
   const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
   try{await page.goto('http://127.0.0.1:3792/production.html?component='+name);await page.waitForFunction(()=>window.__bench?.ready);const exported=await page.evaluate(()=>window.__bench.components);if(Object.keys(UI).some(key=>!exported.includes(key))||exported.some(key=>!(key in UI)))throw Error('Every public component must have exactly one fixture');
    await page.waitForFunction(()=>performance.getEntriesByType('paint').some(e=>e.name==='first-contentful-paint'));const timings=await page.evaluate(()=>performance.getEntriesByType('paint').map(e=>({name:e.name,start:e.startTime})));const fp=timings.find(e=>e.name==='first-paint')?.start,fcp=timings.find(e=>e.name==='first-contentful-paint')?.start;if(fp===undefined||fcp===undefined)throw Error('Paint API did not report required values');paint.push(fp);contentful.push(fcp);
   }finally{await context.close();}
  }
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});let render:number[]=[],updates:number[]=[];
  try{await page.goto('http://127.0.0.1:3792/profiling.html?component='+name);await page.waitForFunction(()=>window.__bench?.ready);
   for(let n=0;n<budgets.samples.warmups;n++)await page.evaluate(()=>window.__bench.update());await page.evaluate(()=>{window.__bench.samples=[];});
   for(let n=0;n<budgets.samples.updates;n++)updates.push(await page.evaluate(()=>window.__bench.update()));
   render=await page.evaluate(()=>window.__bench.samples.filter(s=>s.phase==='update'||s.phase==='nested-update').map(s=>s.actual_ms));if(render.length<budgets.samples.updates)throw Error('Production profiling did not record every update');
  }finally{await page.close();}
  const audit=await lighthouse('http://127.0.0.1:3792/production.html?component='+name,{port:chrome.port,logLevel:'error',output:'json',onlyCategories:['accessibility'],formFactor:'desktop',screenEmulation:{mobile:false,width:1280,height:900,deviceScaleFactor:1,disabled:false}});if(!audit?.lhr.categories.accessibility?.score&&audit?.lhr.categories.accessibility?.score!==0)throw Error('Accessibility audit failed');
  const accessibility=Math.round(audit.lhr.categories.accessibility.score*100),failedAudits=Object.values(audit.lhr.audits).filter(a=>a.score===0).map(a=>({id:a.id,title:a.title}));await writeFile(resolve(out,name+'-lighthouse.json'),JSON.stringify(audit.lhr,null,2));
  const row={paint_ms:median(paint),contentful_ms:median(contentful),render_median_ms:median(render),render_p95_ms:p95(render),update_median_ms:median(updates),update_p95_ms:p95(updates),accessibility,samples:{paint,contentful,render,updates},failed_audits:failedAudits};results[name]=row;
  const limits={...budgets.defaults,...budgets.components[name]};for(const metric of ['paint_ms','contentful_ms','render_p95_ms','update_p95_ms'])if(row[metric as keyof typeof row] as number>limits[metric])failures.push(`${name}: ${metric} exceeds ${limits[metric]}`);if(accessibility<limits.accessibility)failures.push(`${name}: accessibility ${accessibility} below ${limits.accessibility}`);
  console.log(`${name}: FP ${row.paint_ms.toFixed(1)}ms; FCP ${row.contentful_ms.toFixed(1)}ms; render p95 ${row.render_p95_ms.toFixed(2)}ms; update p95 ${row.update_p95_ms.toFixed(1)}ms; accessibility ${accessibility}`);
 }
}catch(error){failures.push('Benchmark run failed: '+(error instanceof Error?error.message:String(error)));}finally{await browser.close();await chrome?.kill();server.close();}
const report={version:1,measured_at:new Date().toISOString(),environment:{platform:platform(),arch:arch(),node:process.version,cpu:cpus()[0]?.model,browser:chromium.executablePath().split('/').at(-3),viewport:'1280x900',throttling:'none; local fixture server',paint_build:'production; fresh browser context per sample',render_build:'production profiling; controlled prop changes; five warmups excluded'},budgets,components:results,failures};
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const summary=['# Component benchmarks','','Isolated fixture measurements; paint includes React/bootstrap and fixture chrome. Rerenders use the production profiling build. Lighthouse scores are automated fixture audits, not a WCAG certification.','','| Component | First paint | FCP | Render median / p95 | Update-to-paint p95 | Accessibility |','|---|---:|---:|---:|---:|---:|',...Object.entries(results).map(([name,r])=>`| ${name} | ${r.paint_ms.toFixed(1)} ms | ${r.contentful_ms.toFixed(1)} ms | ${r.render_median_ms.toFixed(2)} / ${r.render_p95_ms.toFixed(2)} ms | ${r.update_p95_ms.toFixed(1)} ms | ${r.accessibility}/100 |`),'',...failures.map(f=>'- '+f)].join('\n');await writeFile(resolve(out,'summary.md'),summary+'\n');if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
if(failures.length&&!args.includes('--no-gate'))process.exitCode=1;
