const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./ui/dom-fixture.cjs');
const React=require('./ui/node_modules/react');
const {createRoot}=require('./ui/node_modules/react-dom/client');
const {flushSync}=require('./ui/node_modules/react-dom');

test('first login then repeated administrator menu transitions keep the React root mounted',t=>{
  const ui=fixture('<div id="root"></div>','pire-dashboard-calendar.js');
  const prior={window:global.window,document:global.document};global.window=ui.window;global.document=ui.document;
  const errors=[];const root=createRoot(ui.document.querySelector('#root'),{onUncaughtError:error=>errors.push(error)});
  t.after(async()=>{flushSync(()=>root.unmount());await new Promise(resolve=>setImmediate(resolve));global.window=prior.window;global.document=prior.document;ui.close()});
  const h=React.createElement;
  const routes=['Genel Bakış','Müşteriler','Öğrenciler','Eğitmenler','Finans','Dersler','Raporlar','Kullanıcılar','Sistem Sağlığı','Ayarlar','İletişim'];
  function App(){const [route,setRoute]=React.useState(null);if(route===null)return h('button',{onClick:()=>setRoute('Genel Bakış')},'Giriş');
    return h('div',{className:'app-shell'},h('aside',{className:'sidebar'},routes.map(name=>h('button',{key:name,onClick:()=>setRoute(name)},name))),h('main',{className:'content'},h('header',null,h('div',null,route),route==='Genel Bakış'?h('div',{className:'top-actions'},h('div',{className:'pire-new-menu'},h('button',null,'Yeni'))):null),h('section',{className:route==='Genel Bakış'?'premium-dashboard':'route-page'},h('h1',null,route))));
  }
  flushSync(()=>root.render(h(App)));
  flushSync(()=>ui.document.querySelector('button').click());ui.mutate();
  for(let round=0;round<2;round++)for(const name of routes.slice(1)){
    flushSync(()=>[...ui.document.querySelectorAll('.sidebar button')].find(button=>button.textContent===name).click());ui.mutate();
    assert.deepEqual(errors.map(error=>error.message),[]);
    assert.equal(ui.document.querySelector('.content h1')?.textContent,name);
    flushSync(()=>ui.document.querySelector('.sidebar button').click());ui.mutate();
    assert.equal(ui.document.querySelector('.content h1')?.textContent,'Genel Bakış');
  }
});
