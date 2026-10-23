/**
 * Build-time-only authoring API. Styles must be statically analyzable.
 * Never import this file from a runtime component.
 */
export type TokenName =
  | 'font.body' | 'font.mono'
  | 'space.1' | 'space.2' | 'space.3' | 'space.4' | 'space.6'
  | 'radius.sm' | 'radius.md'
  | 'motion.fast' | 'motion.normal'
  | 'color.background' | 'color.panel' | 'color.raised'
  | 'color.border' | 'color.text' | 'color.muted'
  | 'color.accent' | 'color.onAccent' | 'color.accentHover'
  | 'color.hover' | 'color.selected' | 'color.danger' | 'color.warning';

export type StyleValue = string | number;
export type StyleRule = {
  [property: string]: StyleValue | StyleRule;
};
export interface StyleRecipe {
  selector: string;
  base: StyleRule;
  variants?: Record<string, Record<string, StyleRule>>;
}

/** The compiler accepts literal objects and token("literal") calls only. */
export function defineStyles<const T extends Record<string, StyleRecipe>>(styles: T): T {
  return styles;
}

/** Output is a native CSS custom property; no browser-time style injection. */
export function token(name: TokenName): string {
  return 'var(--vui-' + name.replaceAll('.', '-') + ')';
}
