const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./ui/dom-fixture.cjs');
const html=`<div class="app-shell"><aside class="sidebar"></aside><main class="content"><header><div>Title</div><div class="top-actions"><div class="pire-new-menu"></div></div></header><section class="premium-dashboard"></section><div class="admin-preview-actions"><button class="start">Preview</button></div><select class="role-view-switch"><option>Admin</option></select></main></div>`;
for(const [selector,type] of [['.admin-preview-actions .start','click'],['.role-view-switch','change']]){
  test(`${type} panel transition leaves dashboard actions in place before the app handler`,t=>{
    const ui=fixture(html,'pire-dashboard-calendar.js');t.after(()=>ui.close());
    const actions=ui.document.querySelector('.top-actions'),header=ui.document.querySelector('.content > header');
    assert.equal(actions.parentElement,header);
    let handled=false;ui.document.querySelector(selector).addEventListener(type,()=>{handled=true;assert.equal(actions.parentElement,header)});
    ui.document.querySelector(selector).dispatchEvent(new ui.window.Event(type,{bubbles:true}));
    assert.equal(handled,true);assert.equal(actions.parentElement,header);
  });
}
test('route exit leaves the replacement React header intact and disables dashboard enhancement',t=>{
  const ui=fixture(html,'pire-dashboard-calendar.js');t.after(()=>ui.close());
  const content=ui.document.querySelector('.content');
  content.innerHTML='<header><div>Students</div><div class="top-actions"><div class="pire-new-menu"></div></div></header><section class="students-page"></section>';
  const actions=content.querySelector('.top-actions'),header=actions.parentElement;
  ui.mutate();assert.equal(actions.parentElement,header);
  assert.equal(ui.document.querySelector('.app-shell').classList.contains('pire-persistent-header'),false);
  assert.equal(content.querySelector('.pire-dashboard-calendar'),null);
});
