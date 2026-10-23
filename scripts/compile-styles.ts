import ts from 'typescript';
import {compileString} from 'sass';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

type Dict = Record<string, unknown>;
type Theme = {base: Record<string,string>;light: Record<string,string>;dark: Record<string,string>};
const root = resolve(import.meta.dirname, '..');
const ui = resolve(root, 'packages/ui');
const safeName = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/;
const safeKey = /^[a-zA-Z][a-zA-Z0-9]*$/;
const safeVariant = /^[a-z][a-z0-9-]*$/;
const safeSelector = /^\.vui-[a-z][a-z0-9-]*$/;
const safeNested = /^&(?::|::|\[| )(?!.*[{};,])[\w\s\-()[\]="':.]+$/;
const safeMedia = /^@media \((?:min|max)-width: [0-9]+(?:px|rem)\)$/;
const own = (value:unknown): value is Dict => !!value && typeof value==='object' && !Array.isArray(value);
const variable = (name:string) => '--vui-' + name.replaceAll('.', '-');
const fail = (message:string): never => {throw new Error('Style compiler: ' + message);};
function checkValue(value:unknown): string {
  if(typeof value!=='string' || /[{};]/.test(value) || /(?:url|expression)\s*\(/i.test(value)) fail('Unsafe or unsupported CSS value: ' + String(value));
  return value;
}
function readTheme(value:unknown): Theme {
  if(!own(value) || !own(value.base) || !own(value.light) || !own(value.dark)) fail('Invalid token manifest');
  const base=value.base as Record<string,string>, light=value.light as Record<string,string>, dark=value.dark as Record<string,string>;
  const l=Object.keys(light).sort(), d=Object.keys(dark).sort();
  if(JSON.stringify(l)!==JSON.stringify(d)) fail('Light and dark token names must match');
  for(const [key,val] of Object.entries({...base,...light,...dark})){
    if(!safeName.test(key)) fail('Invalid token key ' + key);
    checkValue(val);
  }
  if(Object.keys(base).some(k=>k in light)) fail('Base and theme token keys must be disjoint');
  return {base,light,dark};
}
function literal(node:ts.Expression,allowed:Set<string>):unknown {
  if(ts.isParenthesizedExpression(node)) return literal(node.expression,allowed);
  if(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if(ts.isNumericLiteral(node)) return Number(node.text);
  if(ts.isPrefixUnaryExpression(node) && node.operator===ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  if(ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text==='token' && node.arguments.length===1 && ts.isStringLiteral(node.arguments[0])){
    const name=node.arguments[0].text;
    if(!allowed.has(name)) fail('Unknown token ' + name);
    return 'var(' + variable(name) + ')';
  }
  if(ts.isObjectLiteralExpression(node)){
    const result:Dict=Object.create(null);
    for(const property of node.properties){
      if(!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name)||ts.isStringLiteral(property.name))) fail('Only literal object properties are supported');
      const key=property.name.text;
      if(key==='__proto__'||key==='prototype'||key==='constructor'||Object.hasOwn(result,key)) fail('Invalid or repeated property ' + key);
      result[key]=literal(property.initializer,allowed);
    }
    return result;
  }
  fail('Dynamic expression is forbidden (line ' + ts.getLineAndCharacterOfPosition(node.getSourceFile(),node.pos).line + ')');
}
function extract(source:string,tokens:Set<string>):Dict {
  const file=ts.createSourceFile('components.styles.ts',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
  let definition:Dict|undefined;
  for(const statement of file.statements){
    if(!ts.isVariableStatement(statement)) continue;
    for(const d of statement.declarationList.declarations){
      if(!d.initializer || !ts.isCallExpression(d.initializer) || !ts.isIdentifier(d.initializer.expression) || d.initializer.expression.text!=='defineStyles') continue;
      if(definition || d.initializer.arguments.length!==1) fail('Exactly one defineStyles(object) invocation is allowed');
      const value=literal(d.initializer.arguments[0],tokens);
      if(!own(value)) fail('defineStyles must contain an object');
      definition=value;
    }
  }
  if(!definition) fail('Missing defineStyles call');
  return definition;
}
function kebab(name:string): string {
  if(name.startsWith('--')) return name;
  if(!safeKey.test(name)) fail('Invalid CSS property: ' + name);
  return name.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
}
function rule(selector:string,styles:unknown): string {
  if(!own(styles)) fail('Rule must be an object for ' + selector);
  const decls:string[]=[], children:string[]=[];
  for(const [key,value] of Object.entries(styles)){
    if(own(value)){
      if(safeNested.test(key)) children.push(rule(key.replace('&',selector),value));
      else if(safeMedia.test(key)) children.push(key + '{' + rule(selector,value) + '}');
      else fail('Unsupported nested selector ' + key);
    }else{
      if(typeof value!=='string'&&typeof value!=='number') fail('Invalid value for ' + key);
      const css=checkValue(String(value));
      decls.push(kebab(key)+':'+css+';');
    }
  }
  return (decls.length?selector+'{'+decls.join('')+'}':'')+children.join('');
}
function recipes(styles:Dict):string {
  const rules:string[]=[];
  for(const [component,data] of Object.entries(styles)){
    if(!own(data)||typeof data.selector!=='string'||!safeSelector.test(data.selector)||!own(data.base)) fail('Invalid recipe '+component);
    rules.push(rule(data.selector,data.base));
    if(data.variants!==undefined){
      if(!own(data.variants)) fail('Invalid variants '+component);
      for(const [axis,options] of Object.entries(data.variants)){
        if(!safeVariant.test(axis)||!own(options)) fail('Invalid variant axis '+axis);
        for(const [name,styles] of Object.entries(options)){
          if(!safeVariant.test(name)) fail('Invalid variant name '+name);
          rules.push(rule(data.selector+'[data-'+axis+'="'+name+'"]',styles));
        }
      }
    }
  }
  return rules.join('\n');
}
const aliases:Record<string,string>={
  '--vui-bg':'color.background','--vui-panel':'color.panel','--vui-raised':'color.raised',
  '--vui-border':'color.border','--vui-text':'color.text','--vui-muted':'color.muted',
  '--vui-accent':'color.accent','--vui-font':'font.body'
};
function declarations(values:Record<string,string>):string {
  return Object.entries(values).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>variable(key)+':'+checkValue(value)+';').join('\n');
}
function themes(tokens:Theme):string {
  const common=declarations(tokens.base)+Object.entries(aliases).map(([alias,name])=>alias+':var('+variable(name)+');').join('');
  const light=declarations(tokens.light)+'color-scheme:light;';
  const dark=declarations(tokens.dark)+'color-scheme:dark;';
  return '@layer vui.tokens {\n'+
    '.vui {'+common+light+'color:var(--vui-text);font-family:var(--vui-font);font-size:14px;line-height:1.55;}\n'+
    '@media (prefers-color-scheme: dark) {.vui:not([data-vui-theme]) {'+dark+'}}\n'+
    '.vui[data-vui-theme="light"],[data-vui-theme="light"] .vui {'+light+'}\n'+
    '.vui[data-vui-theme="dark"],[data-vui-theme="dark"] .vui {'+dark+'}\n}\n';
}
const replaces:Record<string,string>={
  '#0c1117':'var(--vui-bg)','#0e151d':'var(--vui-panel)',
  '#131b24':'var(--vui-panel)','#19232e':'var(--vui-raised)',
  '#293645':'var(--vui-border)','#edf2f7':'var(--vui-text)',
  '#a4b2c2':'var(--vui-muted)','#73dec3':'var(--vui-accent)',
  '#3a7164':'var(--vui-border)','#14332e':'var(--vui-selected)',
  '#19312f':'var(--vui-selected)','#263645':'var(--vui-hover)',
  '#9cebd7':'var(--vui-accent-hover)','#09221c':'var(--vui-on-accent)',
  '#334252':'var(--vui-border)','#21303f':'var(--vui-raised)',
  '#c9d6e5':'var(--vui-text)','#15352e':'var(--vui-selected)',
  '#2c5b4f':'var(--vui-border)','#f6d89a':'var(--vui-warning)',
  '#302a1d':'var(--vui-selected)','#675330':'var(--vui-border)',
  '#ffbdba':'var(--vui-danger)','#382427':'var(--vui-selected)',
  '#734145':'var(--vui-border)','#101820':'var(--vui-panel)',
  '#78899c':'var(--vui-muted)','#17212c':'var(--vui-raised)',
  '#46586a':'var(--vui-border)','#04090ed6':'rgb(0 0 0 / 80%)',
  '#18232f':'var(--vui-hover)','#211f19':'var(--vui-selected)',
  '#574b31':'var(--vui-border)','#e2c99a':'var(--vui-warning)',
  '#2a1d21':'var(--vui-selected)','#132a25':'var(--vui-selected)'
};
export async function compileStyles():Promise<void> {
  const tokens=readTheme(JSON.parse(await readFile(resolve(ui,'tokens.json'),'utf8')));
  const allowed=new Set([...Object.keys(tokens.base),...Object.keys(tokens.light)]);
  const source=await readFile(resolve(ui,'src/components.styles.ts'),'utf8');
  const definitions=extract(source,allowed);
  let legacy=await readFile(resolve(ui,'src/styles.css'),'utf8');
  if(!legacy.startsWith('.vui{')) fail('Legacy CSS root changed; migrate it before compiling');
  legacy=legacy.replace(/^\.vui\{[^}]*\}/,'');
  legacy=legacy.replace(/#[0-9a-fA-F]{3,8}\b/g,color=>replaces[color.toLowerCase()]??color);
  legacy=legacy.replaceAll('var(--vui-selected)','var(--vui-color-selected)')
    .replaceAll('var(--vui-hover)','var(--vui-color-hover)')
    .replaceAll('var(--vui-accent-hover)','var(--vui-color-accentHover)')
    .replaceAll('var(--vui-on-accent)','var(--vui-color-onAccent)')
    .replaceAll('var(--vui-warning)','var(--vui-color-warning)')
    .replaceAll('var(--vui-danger)','var(--vui-color-danger)');
  const userScss=await readFile(resolve(ui,'src/custom.scss'),'utf8');
  const scss='@layer vui.tokens, vui.components, vui.overrides;\n'+themes(tokens)+
    '@layer vui.components {\n'+legacy+'\n'+recipes(definitions)+'\n}\n'+
    '@layer vui.overrides {\n'+userScss+'\n}\n';
  const result=compileString(scss,{style:'compressed',syntax:'scss',sourceMap:false});
  await mkdir(resolve(ui,'dist'),{recursive:true});
  await writeFile(resolve(ui,'dist/styles.css'),result.css+'\n');
}
