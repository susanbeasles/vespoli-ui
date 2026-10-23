import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderToString} from 'react-dom/server';
import {Button,Combobox,Dialog} from '../../packages/ui/src/index';

beforeEach(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
});
afterEach(()=>vi.restoreAllMocks());

test('Button renders native HTML and disables activation while loading',async()=>{
  const click=vi.fn();
  const {rerender}=render(<Button loading onClick={click}>Save</Button>);
  const button=screen.getByRole('button',{name:'Save'});
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy','true');
  await userEvent.click(button);
  expect(click).not.toHaveBeenCalled();
  rerender(<Button size="lg" variant="primary" onClick={click}>Save</Button>);
  expect(button).toHaveAttribute('data-size','lg');
  expect(button).not.toBeDisabled();
  await userEvent.click(button);
  expect(click).toHaveBeenCalledOnce();
});

test('Dialog uses a native modal and Escape delegates to the controlled owner',()=>{
  const change=vi.fn();
  const {rerender}=render(<Dialog open title="Details" description="Context" onOpenChange={change}>Body</Dialog>);
  const modal=screen.getByRole('dialog',{name:'Details'});
  expect(modal).toHaveAttribute('open');
  expect(modal).toHaveAccessibleDescription('Context');
  fireEvent(modal,new Event('cancel',{bubbles:false,cancelable:true}));
  expect(change).toHaveBeenCalledWith(false);
  rerender(<Dialog open={false} title="Details" onOpenChange={change}>Body</Dialog>);
  expect(modal).not.toHaveAttribute('open');
});

test('Combobox keyboard selection is accessible and controlled',async()=>{
  const user=userEvent.setup();
  const onChange=vi.fn();
  const choices=[{value:'one',label:'First'},{value:'two',label:'Second'}];
  const {rerender}=render(<Combobox label="Project" options={choices} value="" onValueChange={onChange}/>);
  const field=screen.getByRole('combobox',{name:'Project'});
  await user.click(field);
  expect(field).toHaveAttribute('aria-expanded','true');
  await user.keyboard('{ArrowDown}{Enter}');
  expect(onChange).toHaveBeenCalledWith('two');
  expect(field).toHaveValue('');
  rerender(<Combobox label="Project" options={choices} value="two" onValueChange={onChange}/>);
  expect(field).toHaveValue('Second');
  await user.click(field);
  await user.keyboard('{Escape}');
  expect(field).toHaveAttribute('aria-expanded','false');
});

test('Combobox filters, handles no results, respects disabled items and form value',async()=>{
  const onChange=vi.fn();
  render(<Combobox label="Items" name="item" options={[{value:'a',label:'Apple',disabled:true},{value:'b',label:'Banana'}]} onValueChange={onChange}/>);
  const field=screen.getByRole('combobox',{name:'Items'});
  await userEvent.type(field,'Ban');
  expect(screen.getByRole('option',{name:'Banana'})).toBeVisible();
  expect(screen.queryByRole('option',{name:'Apple'})).toBeNull();
  await userEvent.keyboard('{Enter}');
  expect(onChange).toHaveBeenCalledWith('b');
  expect((document.querySelector('input[name=item]') as HTMLInputElement).value).toBe('b');
  await userEvent.clear(field);
  await userEvent.type(field,'notfound');
  expect(screen.getByText('No matching options')).toBeVisible();
});

test('Components render meaningful SSR markup without style injection',()=>{
  const html=renderToString(<div className="vui"><Button>Ready</Button><Dialog open={false} title="More" onOpenChange={()=>{}}>Details</Dialog><Combobox label="Choose" options={[{value:'a',label:'Alpha'}]}/></div>);
  expect(html).toContain('<button');
  expect(html).toContain('<dialog');
  expect(html).toContain('role="combobox"');
  expect(html).not.toContain('<style');
  expect(html).not.toContain('data-emotion');
});
