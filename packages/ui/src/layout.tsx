import type {HTMLAttributes,ReactNode} from 'react';
export interface Navigation {label:string;href:string;icon?:ReactNode}
export interface ShellProps {brand:ReactNode;mark?:ReactNode;navigation:readonly Navigation[];active:string;children:ReactNode;footer?:ReactNode}
export function Shell({brand,mark,navigation,active,children,footer}:ShellProps){return <div className="vui vui-shell"><a className="vui-skip" href="#content">Skip to content</a><aside className="vui-sidebar"><div className="vui-brand">{mark&&<span className="vui-mark">{mark}</span>}{brand}</div><div className="vui-nav-label">Workspace</div><nav aria-label="Primary">{navigation.map(item=><a key={item.href} href={item.href} aria-current={active===item.href?'page':undefined}>{item.icon}{item.label}</a>)}</nav>{footer&&<footer className="vui-sidebar-foot">{footer}</footer>}</aside><main id="content" className="vui-main" tabIndex={-1}>{children}</main></div>}
export interface HeadingProps {eyebrow?:string;title:string;description?:ReactNode;actions?:ReactNode}
export function Heading({eyebrow,title,description,actions}:HeadingProps){return <header className="vui-heading"><div>{eyebrow&&<p className="vui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p className="vui-description">{description}</p>}</div>{actions&&<div className="vui-actions">{actions}</div>}</header>}
export function Stack({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={'vui-stack '+className} {...props}/>}
export function Card({className='',...props}:HTMLAttributes<HTMLElement>){return <section className={'vui-card '+className} {...props}/>}
export interface Metric {label:string;value:ReactNode;description?:ReactNode;icon?:ReactNode}
export function Metrics({items}:{items:readonly Metric[]}){return <dl className="vui-metrics">{items.map(item=><div key={item.label}><dt>{item.label}{item.icon}</dt><dd>{item.value}{item.description&&<p>{item.description}</p>}</dd></div>)}</dl>}
