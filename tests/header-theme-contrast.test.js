const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('./ui/node_modules/jsdom');
const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'pire-header-theme.css'),'utf8');
const existing=['assets/index--oFWQZ4W.css','pire-dashboard-compact.css','pire-finance-menu.css'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
// Keep recovered header rules, including later !important overrides, while excluding
// unrelated page/card rules that make jsdom's style resolution prohibitively slow.
const cssDocument=new JSDOM(`<style>${existing}</style>`);
const recoveredHeader=[...cssDocument.window.document.styleSheets[0].cssRules]
  .filter(rule=>rule.selectorText&&/sidebar|primary-nav|navbar-|nav-dropdown|role-view-switch|admin-preview-trigger|notification-bell|theme-toggle|session-logout-trigger|authenticated-user|pire-finance/.test(rule.selectorText))
  .map(rule=>rule.cssText).join('\n');
cssDocument.window.close();
const modes=['dashboard-mode','directory-mode','operations-mode','finance-mode','teacher-mode'];
const states=['normal','hover','focus','selected','selected-hover','selected-focus'];
function rgb(color){return color.match(/[\d.]+/g).slice(0,3).map(Number)}
function luminance(color){return rgb(color).map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function rendered(theme,mode){
  const tokens={};const block=patch.match(new RegExp(`html\\[data-theme="${theme}"\\][^{]+\\{([^}]+)\\}`))[1];
  for(const match of block.matchAll(/(--[\w-]+):\s*(#[\da-f]+)/g))tokens[match[1]]=match[2];
  // jsdom does not resolve custom properties or real pointer/keyboard pseudo-states.
  // Substitute theme tokens and same-specificity state classes in ALL stylesheets.
  const css=(recoveredHeader+'\n'+patch).replace(/var\((--pire-header-[\w-]+)\)/g,(_,key)=>tokens[key]).replace(/:hover/g,'.test-hover').replace(/:focus-visible/g,'.test-focus').replace(/:focus-within/g,'.test-focus-within');
  return new JSDOM(`<html data-theme="${theme}"><head><style>${css}</style></head><body><main class="app-shell ${mode}"><aside class="sidebar"><nav class="primary-nav"><button id="nav"><span>Genel Bakış</span><b>8</b></button><details class="nav-dropdown" open><summary><span class="pire-finance-income">Finans</span></summary><div class="nav-dropdown-menu"><button class="pire-finance-income"><span class="pire-finance-income">Tahsilatlar</span></button><button class="pire-finance-expense">Giderler</button></div></details></nav><div class="navbar-tools"><button class="admin-preview-trigger"><span>Görünüm önizle</span><i>◎</i></button><button class="navbar-icon-button">TR</button><button class="theme-toggle">☾</button><button class="session-logout-trigger">Çıkış Yap</button><button class="notification-bell">♢<b>31</b></button><label class="navbar-search"><input placeholder="Ara…"></label><label class="role-view-switch"><span>Görünüm</span><select><option>Yönetici</option></select></label></div></aside></main></body></html>`);
}
for(const theme of ['light','dark'])test(`${theme} navigation and tools keep readable contrast across page modes and interaction states`,()=>{
  for(const mode of modes){
    const dom=rendered(theme,mode),{document}=dom.window;const style=element=>dom.window.getComputedStyle(element);
    for(const state of states){
      const selected=state.startsWith('selected'),hover=state.includes('hover'),focus=state.includes('focus');
      for(const element of document.querySelectorAll('.primary-nav button,.primary-nav summary,.navbar-tools button')){
        element.classList.toggle('test-hover',hover);element.classList.toggle('test-focus',focus);
        if(element.closest('.primary-nav')){
          if(element.tagName==='SUMMARY')element.parentElement.classList.toggle('active',selected);else element.classList.toggle('active',selected);
        }
        const computed=style(element),ratio=contrast(computed.color,computed.backgroundColor);
        assert.ok(ratio>=4.5,`${theme}/${mode}/${state}/${element.textContent}: ${ratio.toFixed(2)}`);
        if(focus)assert.match(computed.outline,/2px solid/);
        const badge=element.querySelector('b');if(badge){const computedBadge=style(badge);assert.ok(contrast(computedBadge.color,computedBadge.backgroundColor)>=4.5,`badge contrast: ${theme}/${state}`)}
      }
    }
    assert.equal(style(document.querySelector('.nav-dropdown-menu')).backgroundColor,style(document.querySelector('.navbar-search')).backgroundColor);
    dom.window.close();
  }
});
test('theme stylesheet is included in deployed bootstrap without changing navigation code',()=>{
  const build=fs.readFileSync(path.join(root,'scripts/fix123-strip-legacy-backend.js'),'utf8');
  assert.ok(build.includes('headerTheme.href="/pire-header-theme.css?v=1"'));
  assert.ok(build.indexOf('headerTheme.href=')>build.indexOf('for(const [href,attribute] of ${serializedStyles})'));
});
