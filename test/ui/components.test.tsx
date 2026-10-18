import {test,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Shell,TextField,SelectField,Table,Pagination,Notice} from '../../packages/ui/src/index';

test('fields report changes without owning their value',async()=>{
 const change=vi.fn();const view=render(<TextField id="query" label="Search" value="original" onChange={e=>change(e.currentTarget.value)}/>);
 const field=screen.getByRole('textbox',{name:'Search'});await userEvent.type(field,'x');expect(change).toHaveBeenCalledWith('originalx');expect(field).toHaveValue('original');
 view.rerender(<TextField id="query" label="Search" value="parent value" onChange={()=>{}}/>);expect(field).toHaveValue('parent value');
 render(<SelectField id="kind" label="Kind" value="all" options={[{value:'all',label:'All'},{value:'one',label:'One'}]} onChange={e=>change(e.currentTarget.value)}/>);
 await userEvent.selectOptions(screen.getByRole('combobox',{name:'Kind'}),'one');expect(change).toHaveBeenCalledWith('one');expect(screen.getByRole('combobox')).toHaveValue('all');
});
test('table renders arbitrary entities, escapes untrusted text, and has an accessible name',()=>{
 render(<Table caption="Inventory" rows={[{id:'one',title:'<script>bad()</script>'}]} rowKey={r=>r.id} columns={[{id:'title',header:'Title',cell:r=>r.title}]}/>);
 expect(screen.getByRole('table',{name:'Inventory'})).toBeInTheDocument();expect(screen.getByText('<script>bad()</script>')).toBeInTheDocument();expect(document.querySelector('script')).toBeNull();
});
test('navigation identifies the active page and pagination delegates actions',async()=>{
 const next=vi.fn();render(<Shell brand="Example" navigation={[{label:'Home',href:'/home'},{label:'Records',href:'/records'}]} active="/records"><Pagination label="Page 1" onNext={next}/></Shell>);
 expect(screen.getByRole('link',{name:'Records'})).toHaveAttribute('aria-current','page');expect(screen.getByRole('button',{name:'Previous'})).toBeDisabled();await userEvent.click(screen.getByRole('button',{name:'Next'}));expect(next).toHaveBeenCalledOnce();
});
test('empty and error states have useful semantics',()=>{
 render(<><Notice tone="danger" title="Could not load">Try again.</Notice><Table caption="Empty inventory" rows={[]} rowKey={(r:{id:string})=>r.id} columns={[{id:'id',header:'ID',cell:r=>r.id}]} empty={<p>No matching records.</p>}/></>);
 expect(screen.getByRole('alert')).toHaveTextContent('Could not load');expect(screen.getByText('No matching records.')).toBeInTheDocument();
});
