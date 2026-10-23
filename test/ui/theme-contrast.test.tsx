import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect,test} from 'vitest';

const manifest=JSON.parse(readFileSync(resolve(process.cwd(),'packages/ui/tokens.json'),'utf8')) as {
  light:Record<string,string>;
  dark:Record<string,string>;
};
function luminance(hex:string):number {
  if(!/^#[0-9a-f]{6}$/i.test(hex))throw new Error('Contrast tests require hexadecimal tokens: '+hex);
  const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const [r,g,b]=channels.map(c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4));
  return r*0.2126+g*0.7152+b*0.0722;
}
function contrast(a:string,b:string):number {
  const light=Math.max(luminance(a),luminance(b)),dark=Math.min(luminance(a),luminance(b));
  return (light+0.05)/(dark+0.05);
}
const combinations:[string,string][]=[
  ['color.text','color.background'],
  ['color.text','color.panel'],
  ['color.text','color.raised'],
  ['color.muted','color.background'],
  ['color.muted','color.panel'],
  ['color.accent','color.background'],
  ['color.accent','color.panel'],
  ['color.accent','color.selected'],
  ['color.accent','color.raised'],
  ['color.onAccent','color.accent'],
  ['color.onAccent','color.accentHover'],
  ['color.danger','color.background'],
  ['color.warning','color.background']
];
for(const mode of ['light','dark'] as const){
  for(const [foreground,background] of combinations){
    test(mode+': '+foreground+' on '+background+' meets WCAG AA normal-text contrast',()=>{
      const theme=manifest[mode];
      expect(contrast(theme[foreground],theme[background])).toBeGreaterThanOrEqual(4.5);
    });
  }
}
