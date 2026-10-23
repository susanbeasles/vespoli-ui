# Vespoli UI: compile-time styling v0

## Scope

This feature introduces a deterministic, static subset of CSS-in-TS authoring
and precompiled Sass. It is a vertical slice, not a complete styling DSL.

Existing React exports remain available. Button, Dialog, and Combobox exercise
native semantics, loading, focus behavior, tokens, SSR, and controlled state.

## Styling pipeline

1. packages/ui/tokens.json owns light/dark semantic theme values.
2. packages/ui/src/components.styles.ts defines static recipes with
   defineStyles() and typed token('color.text') references.
3. scripts/compile-styles.ts parses TypeScript syntax without executing
   authored modules. It rejects dynamic expressions, spreads, computed keys,
   unknown tokens, and unsupported selectors.
4. It generates Sass-compatible native selectors, layers them with the
   existing component stylesheet and custom.scss, and runs pinned Dart Sass.
5. dist/styles.css is the compiled stylesheet. No runtime style injection,
   stylesheet registry, or CSS-in-JS engine ships in the component bundle.

Legacy CSS stays in the vui.components layer. Migration is incremental.

## Theming

Import vespoli-ui/styles.css once. Wrap elements in .vui (or use Shell) and
optionally put data-vui-theme="light" or "dark" on the element or an ancestor.
Otherwise the system preference determines dark/light mode.

Theme selection only changes CSS custom properties. No React rerender is
required. Broader design-token ingestion is a future stage, not yet public.

## Usage (TSX)

    import {Button,Dialog,Combobox} from 'vespoli-ui';
    import 'vespoli-ui/styles.css';

    <Button variant="primary" size="md" loading={isSaving}>Save</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Details">
      <p>Server-rendered dialog content</p>
    </Dialog>
    <Combobox label="Repository" options={repos}
      value={selected} onValueChange={setSelected} />

Combobox currently supports local, single-select filtering. Server-side
search, async pagination, virtualization, and caching belong in a future
optional adapter, not the component core.

## Validation and limitations

Run npm ci --ignore-scripts, npm run check, and npm run bench. The benchmark
harness measures isolated components, not cross-library performance leadership.
Manual keyboard, screen-reader, forced-colors and mobile tests remain necessary.

Only literal object recipes and literal calls to token() are supported.
The compiler will not execute project JavaScript or accept arbitrary computed
expressions. Use CSS custom properties for runtime values. The Sass version
is pinned through the package lockfile.
