import {Profiler,useState,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import * as UI from 'vespoli-ui';
import 'vespoli-ui/styles.css';
const noop=()=>{};
const cases:Record<string,(tick:number)=>ReactNode>={
 Properties:n=><UI.Properties items={[{label:"Identity",value:"record-"+n},{label:"Status",value:"Recorded"}]}/>,
 Disclosure:n=><UI.Disclosure title={"Original record "+n} open={n%2===0}><p>Retained details</p></UI.Disclosure>,
 Shell:n=><UI.Shell brand={'Workspace '+n} mark="W" active={n%2?'/one':'/two'} navigation={[{label:'Overview',href:'/one'},{label:'Records',href:'/two'}]}><UI.Heading title="Workspace overview" description="Component benchmark fixture"/></UI.Shell>,
 Heading:n=><UI.Heading eyebrow="Workspace" title={'Overview '+n} description="A concise description of this workspace." actions={<UI.Button onClick={noop}>Refresh</UI.Button>}/>,
 Stack:n=><UI.Stack><p>First item {n}</p><p>Second item</p></UI.Stack>,
 Card:n=><UI.Card><p style={{padding:24}}>Content {n}</p></UI.Card>,
 Metrics:n=><UI.Metrics items={[{label:'Records',value:100+n,description:'Recorded items'},{label:'Sources',value:12+n},{label:'Scans',value:24+n}]}/>,
 Button:n=><UI.Button variant={n%2?'primary':'secondary'} onClick={noop}>Action {n}</UI.Button>,
 TextField:n=><UI.TextField id="query" label="Search records" value={'Record '+n} onChange={noop} hint="Search by record name."/>,
 SelectField:n=><UI.SelectField id="status" label="Status" value={n%2?'active':'all'} onChange={noop} options={[{value:'all',label:'All records'},{value:'active',label:'Active'}]}/>,
 Toolbar:n=><UI.Toolbar actions={<UI.Button onClick={noop}>Apply {n}</UI.Button>}><UI.TextField id="filter" label="Repository" value={'Source '+n} onChange={noop}/></UI.Toolbar>,
 Pagination:n=><UI.Pagination label={'Page '+(n+1)} onNext={noop} onPrevious={n?noop:undefined}/>,
 Badge:n=><UI.Badge tone={n%2?'success':'neutral'}>Status {n}</UI.Badge>,
 Notice:n=><UI.Notice title={'Collection status '+n} tone={n%2?'warning':'neutral'} action={<UI.Button onClick={noop}>Review</UI.Button>}>Some sources are awaiting a scan.</UI.Notice>,
 Empty:n=><UI.Empty title={'No matching records '+n} description="Change the current filters to see more records." action={<UI.Button onClick={noop}>Clear filters</UI.Button>}/>,
 Code:n=><UI.Code>{'identity-'+n}</UI.Code>,
 CodeBlock:n=><UI.CodeBlock label="Record source" value={JSON.stringify({version:n,items:Array.from({length:40},(_,id)=>({id,name:'Record '+id}))},null,2)}/>,
 Table:n=><UI.Table caption="Record inventory" rows={Array.from({length:100},(_,id)=>({id,name:'Record '+(id+n),status:id%2?'Active':'Pending'}))} rowKey={r=>r.id} columns={[{id:'name',header:'Name',cell:r=>r.name},{id:'status',header:'Status',cell:r=><UI.Badge>{r.status}</UI.Badge>},{id:'action',header:'Action',cell:r=><UI.Button onClick={noop}>Inspect {r.id}</UI.Button>}]}/>,
 Dialog:n=><UI.Dialog open title={'Record '+n} description="Modal details" onOpenChange={noop}>Record details</UI.Dialog>,
 Combobox:n=><UI.Combobox label="Repository" value={n%2?'alpha':'beta'} options={[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'}]} onValueChange={noop}/>,
 Inspector:n=><UI.Inspector open title={'Record '+n} onClose={noop} description="Read-only record inspection"><UI.CodeBlock label="Original record" value={JSON.stringify({id:n,source:'Example'},null,2)}/></UI.Inspector>,
 Icon:n=><span aria-label="Activity indicator" role="img"><UI.Icon name={n%2?'activity':'layers'}/></span>,
};
interface Sample {phase:string;actual_ms:number;base_ms:number;commit_ms:number}
declare global{interface Window{__bench:{ready:boolean;components:string[];samples:Sample[];update:()=>Promise<number>}}}
const name=new URLSearchParams(location.search).get('component')??'Button';
if(!cases[name])throw Error('Unknown component fixture');
window.__bench={ready:false,components:Object.keys(cases),samples:[],update:async()=>0};
function Fixture(){const [tick,setTick]=useState(0);window.__bench.update=async()=>{const start=performance.now();flushSync(()=>setTick(n=>n+1));await new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done())));return performance.now()-start;};const component=<Profiler id={name} onRender={(_id,phase,actual,base,_start,commit)=>window.__bench.samples.push({phase,actual_ms:actual,base_ms:base,commit_ms:commit})}>{cases[name](tick)}</Profiler>;return name==='Shell'?component:<div className="vui" style={{background:'var(--vui-bg)',minHeight:'100vh',padding:32}}><main><h1 style={{marginBottom:24,fontSize:24}}>{name} component</h1>{component}</main></div>;}
createRoot(document.getElementById('fixture')!).render(<Fixture/>);
requestAnimationFrame(()=>requestAnimationFrame(()=>window.__bench.ready=true));
