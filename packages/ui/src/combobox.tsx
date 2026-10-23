import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';

export interface ComboboxOption {value:string;label:string;disabled?:boolean}
export interface ComboboxProps {
  id?:string;
  label:string;
  options:readonly ComboboxOption[];
  value?:string;
  defaultValue?:string;
  onValueChange?:(value:string)=>void;
  name?:string;
  placeholder?:string;
  disabled?:boolean;
  required?:boolean;
  emptyMessage?:string;
  className?:string;
}

/**
 * Single-select, local filtering combobox. Selection can be controlled or
 * uncontrolled. ARIA active-descendant keeps DOM focus on the input.
 */
export function Combobox({id,label,options,value,defaultValue='',onValueChange,name,placeholder,disabled=false,required=false,emptyMessage='No matching options',className=''}:ComboboxProps){
  const generatedId=useId();
  const inputId=id??('vui-combobox-'+generatedId);
  const listId=inputId+'-listbox';
  const root=useRef<HTMLDivElement>(null);
  const input=useRef<HTMLInputElement>(null);
  const [internalValue,setInternalValue]=useState(defaultValue);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const selectedValue=value??internalValue;
  const selected=options.find(option=>option.value===selectedValue);
  const matches=options.filter(option=>option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const enabled=matches.map((option,index)=>option.disabled?-1:index).filter(index=>index>=0);
  const activeOption=matches[active];
  function choose(option:ComboboxOption){
    if(option.disabled)return;
    if(value===undefined)setInternalValue(option.value);
    onValueChange?.(option.value);
    setQuery('');
    setOpen(false);
    setActive(0);
    input.current?.focus();
  }
  function onKeyDown(event:KeyboardEvent<HTMLInputElement>){
    if(disabled)return;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();
      if(!open){setOpen(true);setQuery('');setActive(0);return;}
      if(!enabled.length)return;
      const current=enabled.indexOf(active);
      const direction=event.key==='ArrowDown'?1:-1;
      const next=(current+direction+enabled.length)%enabled.length;
      setActive(enabled[next]);
    }else if(event.key==='Enter'&&open){
      event.preventDefault();
      if(activeOption&&!activeOption.disabled)choose(activeOption);
    }else if(event.key==='Escape'&&open){
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }else if(event.key==='Tab'){
      setOpen(false);
      setQuery('');
    }
  }
  useEffect(()=>{
    if(!open)return;
    const onOutside=(event:PointerEvent)=>{
      if(event.target instanceof Node && !root.current?.contains(event.target)){
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown',onOutside);
    return ()=>document.removeEventListener('pointerdown',onOutside);
  },[open]);
  return <div className={'vui vui-combobox '+className} ref={root} data-disabled={disabled||undefined}>
    <label htmlFor={inputId}>{label}</label>
    <input ref={input} id={inputId} role="combobox" type="text" autoComplete="off"
      aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open?listId:undefined}
      aria-activedescendant={open&&activeOption&&!activeOption.disabled?listId+'-'+active:undefined}
      value={open?query:(selected?.label??'')}
      placeholder={placeholder} disabled={disabled} required={required}
      onChange={event=>{setQuery(event.target.value);setActive(0);setOpen(true);}}
      onClick={()=>{if(!disabled&&!open){setQuery('');setActive(0);setOpen(true);}}}
      onKeyDown={onKeyDown}
      onBlur={event=>{if(!root.current?.contains(event.relatedTarget)){setOpen(false);setQuery('');}}}
    />
    {name&&<input type="hidden" name={name} value={selectedValue} disabled={disabled}/>}
    {open&&<ul id={listId} role="listbox" aria-label={label}>
      {matches.map((option,index)=><li key={option.value} id={listId+'-'+index}
        role="option" aria-selected={option.value===selectedValue} aria-disabled={option.disabled||undefined}
        data-active={index===active||undefined} onPointerDown={event=>event.preventDefault()}
        onClick={()=>choose(option)}>{option.label}</li>)}
      {!matches.length&&<li role="presentation" className="vui-combobox__empty">{emptyMessage}</li>}
    </ul>}
  </div>;
}
