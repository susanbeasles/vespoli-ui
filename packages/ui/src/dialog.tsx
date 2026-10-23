import {useEffect,useId,useRef,type DialogHTMLAttributes,type ReactNode} from 'react';
import {Button} from './controls.js';

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>,'open'|'onClose'|'onCancel'|'title'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Native showModal() provides focus confinement, Escape semantics and top layer.
 * Controlled by the caller. Dialog contents render as real server HTML.
 */
export function Dialog({open,onOpenChange,title,description,children,actions,className='',...props}:DialogProps) {
  const ref=useRef<HTMLDialogElement>(null);
  const generated=useId();
  const titleId=generated+'-title';
  const descriptionId=generated+'-description';
  useEffect(()=>{
    const dialog=ref.current;
    if(!dialog) return;
    if(open && !dialog.open) dialog.showModal();
    else if(!open && dialog.open) dialog.close();
  },[open]);
  return <dialog {...props} ref={ref} className={'vui vui-dialog '+className}
    aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined}
    onCancel={event=>{event.preventDefault();onOpenChange(false);}}
    onClose={()=>{if(open)onOpenChange(false);}}>
    <header className="vui-dialog__header">
      <div><h2 id={titleId}>{title}</h2>{description&&<p id={descriptionId}>{description}</p>}</div>
      <Button aria-label="Close dialog" variant="quiet" onClick={()=>onOpenChange(false)}>×</Button>
    </header>
    <div className="vui-dialog__body">{children}</div>
    {actions&&<footer className="vui-dialog__actions">{actions}</footer>}
  </dialog>;
}
