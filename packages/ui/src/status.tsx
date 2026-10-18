import type {ReactNode} from 'react';
export type Tone='neutral'|'success'|'warning'|'danger';
export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:Tone}){return <span className={'vui-badge vui-tone-'+tone}>{children}</span>}
export function Notice({title,children,tone='neutral',action}:{title:string;children?:ReactNode;tone?:Tone;action?:ReactNode}){return <div className={'vui-notice vui-tone-'+tone} role={tone==='danger'?'alert':'status'}><div><strong>{title}</strong>{children&&<div>{children}</div>}</div>{action}</div>}
export function Empty({title,description,action}:{title:string;description?:ReactNode;action?:ReactNode}){return <div className="vui-empty"><span className="vui-empty-mark" aria-hidden="true">◇</span><h2>{title}</h2>{description&&<p>{description}</p>}{action}</div>}
export function Code({children}:{children:string}){return <code className="vui-code">{children}</code>}
export function CodeBlock({value,label}:{value:string;label:string}){return <pre className="vui-codeblock" aria-label={label} tabIndex={0}><code>{value}</code></pre>}
