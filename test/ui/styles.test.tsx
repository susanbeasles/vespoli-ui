import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect,test} from 'vitest';

test('generated stylesheet is layered, themed, and contains extracted styles',()=>{
  const css=readFileSync(resolve(process.cwd(),'packages/ui/dist/styles.css'),'utf8');
  expect(css).toContain('vui.tokens');
  expect(css).toContain('vui.components');
  expect(css).toContain('data-vui-theme');
  expect(css).toContain('prefers-color-scheme');
  expect(css).toContain('data-variant');
  expect(css).toContain('data-size');
  expect(css).toContain('--vui-color-background');
  expect(css).not.toContain('style[data-');
});
