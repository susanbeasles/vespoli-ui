import {defineStyles, token} from './style-contract.js';

/**
 * Compile-time style source; this file is never imported by a runtime component.
 * No arbitrary expressions, computed properties, spreads, or dynamic selectors.
 */
export const components = defineStyles({
  button: {
    selector: '.vui-button',
    base: {
      gap: token('space.2'),
      borderRadius: token('radius.sm'),
      '@media (prefers-reduced-motion: no-preference)': {
        transition: 'background-color var(--vui-motion-fast) ease, color var(--vui-motion-fast) ease'
      },
      '&:focus-visible': {
        outline: '2px solid var(--vui-color-accent)',
        outlineOffset: '3px'
      },
      '&[data-loading="true"]': {
        cursor: 'progress'
      }
    },
    variants: {
      variant: {
        primary: {
          backgroundColor: token('color.accent'),
          color: token('color.onAccent'),
          borderColor: token('color.accent'),
          '&:hover:not(:disabled)': {backgroundColor: token('color.accentHover')}
        },
        secondary: {
          backgroundColor: token('color.raised'),
          color: token('color.text'),
          borderColor: token('color.border'),
          '&:hover:not(:disabled)': {backgroundColor: token('color.hover')}
        },
        quiet: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: token('color.text')
        }
      },
      size: {
        sm: {minHeight: '32px', padding: '5px 10px'},
        md: {minHeight: '40px', padding: '9px 13px'},
        lg: {minHeight: '48px', padding: '12px 18px'}
      }
    }
  },
  dialog: {
    selector: '.vui-dialog',
    base: {
      color: token('color.text'),
      backgroundColor: token('color.panel'),
      border: '1px solid var(--vui-color-border)',
      borderRadius: token('radius.md'),
      maxWidth: 'min(38rem, calc(100vw - 2rem))',
      width: '100%',
      maxHeight: 'calc(100dvh - 2rem)',
      padding: token('space.6'),
      '&::backdrop': {
        backgroundColor: 'rgb(0 0 0 / 65%)'
      },
      '&[open]': {
        animation: 'vui-dialog-enter var(--vui-motion-normal) ease-out'
      }
    }
  },
  combobox: {
    selector: '.vui-combobox',
    base: {
      position: 'relative',
      display: 'grid',
      gap: token('space.2'),
      color: token('color.text'),
      '& input': {
        width: '100%',
        minHeight: '40px',
        padding: token('space.3'),
        borderRadius: token('radius.sm'),
        color: token('color.text'),
        backgroundColor: token('color.raised'),
        border: '1px solid var(--vui-color-border)'
      },
      '& input:focus-visible': {
        outline: '2px solid var(--vui-color-accent)',
        outlineOffset: '2px'
      },
      '& [role="listbox"]': {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        zIndex: '10',
        margin: '0',
        padding: token('space.1'),
        listStyle: 'none',
        backgroundColor: token('color.panel'),
        border: '1px solid var(--vui-color-border)',
        borderRadius: token('radius.sm'),
        maxHeight: '16rem',
        overflowY: 'auto'
      },
      '& [role="option"]': {
        padding: token('space.2'),
        cursor: 'pointer'
      },
      '& [role="option"][data-active="true"]': {
        backgroundColor: token('color.selected')
      }
    }
  }
});
