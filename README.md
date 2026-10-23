# vespoli-ui

Controlled React components for clear, accessible data interfaces. TypeScript declarations, tree-shakeable ESM, CommonJS, and a separate theme stylesheet. React 18.3 or 19 is a peer dependency; no data fetching, router, global store, telemetry, or external fonts are included.

```tsx
import {useState} from 'react';
import {Shell,Heading,Card,Table,TextField,Button} from 'vespoli-ui';
import 'vespoli-ui/styles.css';

export function Inventory({rows}:{rows:{id:string;name:string}[]}) {
  const [query,setQuery]=useState('');
  return <Shell brand="My workspace" active="/records"
    navigation={[{label:'Records',href:'/records'}]}>
    <Heading title="Records" description="A shared, predictable workspace." />
    <TextField id="search" label="Search" value={query}
      onChange={event=>setQuery(event.currentTarget.value)}/>
    <Card><Table caption="Record inventory" rowKey={row=>row.id}
      rows={rows.filter(row=>row.name.includes(query))}
      columns={[{id:'name',header:'Name',cell:row=>row.name}]}/></Card>
  </Shell>;
}
```

For standalone components, wrap the section in `<div className="vui">`. Styles are scoped to that root. Override `--vui-bg`, `--vui-panel`, `--vui-raised`, `--vui-border`, `--vui-text`, `--vui-muted`, `--vui-accent` and `--vui-font` to theme the library. Consumers must preserve contrast in custom themes.

## Components

| Component | Props and responsibility |
|---|---|
| Shell | `brand`, optional `mark`, `navigation`, `active`, `footer`, `children`; responsive navigation and a skip link. One shell per document. |
| Heading | `title`, `eyebrow`, `description`, `actions`; page hierarchy. |
| Stack / Card | Standard div/section attributes and children; composition and surfaces. |
| Metrics | `items: {label,value,description?,icon?}[]`; semantic summary cards. |
| Button | Standard button attributes and `variant: primary / secondary / quiet`. Defaults to `type="button"`. |
| TextField | Native input attributes plus required `id`/`label`, optional `hint`. Supports controlled `value/onChange` or native `defaultValue`. |
| SelectField | Native select attributes plus `id`, `label`, `options: {value,label}[]`. |
| Toolbar | `children` and optional `actions`; responsive filter composition. |
| Pagination | `label`, `onPrevious?`, `onNext?`, `busy?`; absent handlers disable controls. No internal cursor. |
| Table | `rows: T[]`, `rowKey`, typed `columns: {id,header,cell,align?,width?}[]`, `caption`, `empty?`, `busy?`. Scroll region is keyboard focusable. |
| Badge / Notice | `tone: neutral / success / warning / danger`; Notice adds `title`, children and action. Use notices sparingly; errors use an alert role. |
| Empty | `title`, `description`, `action`; an actionable empty state. |
| Code / CodeBlock | Escaped code text; CodeBlock takes `value` and an accessible `label`. |
| Inspector | Controlled `open`, `onClose`, `title`, `description`, `actions`, `children`; native dialog handles modal focus, escape and focus restoration. |
| Icon | `name: activity / branch / shield / refresh / arrow / layers`; decorative SVG. Supply accessible text on the parent control. |
| Properties | `items: {label,value}[]`; semantic record metadata. |
| Disclosure | `title`, children and native details attributes; native disclosure behavior. |

The library owns no application state. Inspector's effect only synchronizes the caller's `open` prop with the native dialog. Text values are escaped by React. There are no `dangerouslySetInnerHTML` APIs.

## Performance and accessibility

Every exported runtime component has an isolated benchmark fixture. Workflows retain JSON timings and Lighthouse accessibility reports for each component, plus a readable summary. First paint and FCP use ordinary production React with three fresh-context navigations; controlled rerenders use the production profiling build with five excluded warmups and 30 measured updates. Reports include median/p95 React render time and end-to-end update-to-paint latency. Paint includes shared React/bootstrap and fixture markup; it is not an intrinsic component-only cost.

Pull requests benchmark the base revision and proposed revision on the same runner, then enforce versioned absolute budgets and regression tolerances. Environment mismatches fail rather than comparing unrelated machines. Lighthouse scores apply to tested fixtures; they do not certify WCAG conformance or guarantee accessibility under arbitrary consumer props. Keyboard, focus, zoom/reflow, reduced motion and assistive-technology reviews still matter. Mobile page compositions are checked separately.

Source and workflows: https://github.com/susanbeasles/vespoli-ui

## Compile-time styles and semantic themes

See [the compiled style system](docs/STYLE_SYSTEM.md) for the Sass pipeline, typed recipes, light/dark tokens, interactive primitives, and current limitations.
