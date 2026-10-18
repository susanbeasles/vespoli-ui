import type {DetailsHTMLAttributes,ReactNode} from 'react';
export interface Property {label:string;value:ReactNode}
export function Properties({items}:{items:readonly Property[]}){return <dl className="vui-properties">{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
export interface DisclosureProps extends DetailsHTMLAttributes<HTMLDetailsElement>{title:string}
/** Native disclosure semantics; callers may supply the standard open/onToggle props. */
export function Disclosure({title,children,className='',...props}:DisclosureProps){return <details className={'vui-disclosure '+className} {...props}><summary>{title}</summary><div>{children}</div></details>}
