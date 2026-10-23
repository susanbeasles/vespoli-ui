import type {ButtonHTMLAttributes,InputHTMLAttributes,SelectHTMLAttributes,ReactNode} from 'react';
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>,'size'> {
  variant?:'primary'|'secondary'|'quiet';
  size?:'sm'|'md'|'lg';
  loading?:boolean;
}
export function Button({variant='secondary',size='md',loading=false,className='',type='button',disabled,...props}:ButtonProps){
  return <button {...props} type={type} className={'vui-button vui-button-'+variant+' '+className}
    data-variant={variant} data-size={size} data-loading={loading||undefined}
    disabled={disabled||loading} aria-busy={loading||undefined}/>;
}
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>{id:string;label:string;hint?:string}
export function TextField({id,label,hint,className='',...props}:TextFieldProps){return <div className={'vui-field '+className}><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint?id+'-hint':undefined} {...props}/>{hint&&<small id={id+'-hint'}>{hint}</small>}</div>}
export interface Option {label:string;value:string}
export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>{id:string;label:string;options:readonly Option[]}
export function SelectField({id,label,options,className='',...props}:SelectFieldProps){return <div className={'vui-field '+className}><label htmlFor={id}>{label}</label><select id={id} {...props}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
export function Toolbar({children,actions}:{children:ReactNode;actions?:ReactNode}){return <div className="vui-toolbar"><div className="vui-filters">{children}</div>{actions&&<div className="vui-actions">{actions}</div>}</div>}
export interface PaginationProps {label:string;onPrevious?:()=>void;onNext?:()=>void;busy?:boolean}
export function Pagination({label,onPrevious,onNext,busy}:PaginationProps){return <nav className="vui-pagination" aria-label="Pagination"><p aria-live="polite">{label}</p><div className="vui-actions"><Button onClick={onPrevious} disabled={!onPrevious||busy}>Previous</Button><Button onClick={onNext} disabled={!onNext||busy}>Next</Button></div></nav>}
