(()=>{
  'use strict';
  if(window.__PIRE_VISITOR_HOME_V2__)return;
  window.__PIRE_VISITOR_HOME_V2__=true;

  const GOLD='#d6b55f';
  const navMap={
    academic:'Akademik Koçluk',
    instrument:'Enstrüman Eğitimi',
    production:'Prodüktörlük ve Stüdyo Kaydı',
    event:'Organizasyon',
    contact:'İletişim'
  };
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  function findClickableByText(label){
    const wanted=norm(label);
    return [...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===wanted)||
      [...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent).includes(wanted));
  }
  function go(key){
    const label=navMap[key];
    const target=findClickableByText(label);
    if(target){target.click();scrollTo({top:0,behavior:'smooth'});return true}
    return false;
  }
  function isVisitorHome(){
    const signIn=findClickableByText('Giriş Yap')||findClickableByText('Sign In');
    const h1=[...document.querySelectorAll('h1')].find(x=>/Matematik ve müziğin|mathematics and music/i.test(norm(x.textContent)));
    const home=findClickableByText('Ana Sayfa')||findClickableByText('Home');
    return Boolean(signIn&&h1&&home);
  }
  function css(){
    if(document.getElementById('pire-vh2-style'))return;
    const style=document.createElement('style');style.id='pire-vh2-style';style.textContent=`
      #pire-vh2{background:#080a09;color:#f5f0e5;overflow:hidden;border-top:1px solid rgba(214,181,95,.16)}
      #pire-vh2 *{box-sizing:border-box}.pvh-wrap{width:min(1460px,92vw);margin:auto}.pvh-section{padding:92px 0;position:relative}
      .pvh-kicker{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};font-weight:800;margin-bottom:16px}.pvh-title{font-size:clamp(38px,5vw,76px);line-height:.98;letter-spacing:-.045em;margin:0;max-width:980px}.pvh-title em{font-family:Georgia,serif;font-weight:400;color:${GOLD}}
      .pvh-sub{font-size:17px;line-height:1.8;color:#a9a79f;max-width:720px;margin:22px 0 0}.pvh-marquee{border-bottom:1px solid rgba(214,181,95,.16);white-space:nowrap;overflow:hidden;background:#0d0f0d}.pvh-track{display:inline-flex;gap:42px;align-items:center;padding:20px 0;animation:pvhSlide 26s linear infinite}.pvh-track span{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ded8ca}.pvh-track b{color:${GOLD};font-size:18px}@keyframes pvhSlide{to{transform:translateX(-50%)}}
      .pvh-services{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;margin-top:48px}.pvh-card{position:relative;min-height:360px;border:1px solid rgba(255,255,255,.09);border-radius:22px;overflow:hidden;background:linear-gradient(145deg,#151713,#0b0c0a);cursor:pointer;transition:.35s ease}.pvh-card:hover{transform:translateY(-8px);border-color:rgba(214,181,95,.48);box-shadow:0 22px 60px rgba(0,0,0,.35)}.pvh-card.big{grid-column:span 7}.pvh-card.small{grid-column:span 5}.pvh-card-media{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.48;transition:.5s ease}.pvh-card:hover .pvh-card-media{transform:scale(1.04);opacity:.58}.pvh-card:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 18%,rgba(5,7,5,.22) 45%,rgba(5,7,5,.95) 100%)}.pvh-card-body{position:absolute;z-index:2;left:28px;right:28px;bottom:26px}.pvh-card-num{font-size:12px;color:${GOLD};letter-spacing:.16em}.pvh-card h3{font-size:31px;margin:9px 0 9px;letter-spacing:-.03em}.pvh-card p{margin:0;color:#b8b5ab;line-height:1.55}.pvh-arrow{position:absolute;right:26px;top:24px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(214,181,95,.38);color:${GOLD};font-size:20px;z-index:3;transition:.3s}.pvh-card:hover .pvh-arrow{background:${GOLD};color:#0b0c09;transform:rotate(45deg)}
      .pvh-why{display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center}.pvh-benefits{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pvh-benefit{border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:24px;background:rgba(255,255,255,.025);transition:.3s}.pvh-benefit:hover{border-color:rgba(214,181,95,.38);transform:translateY(-4px)}.pvh-benefit strong{font-size:17px;display:block;margin-bottom:8px}.pvh-benefit span{font-size:14px;line-height:1.6;color:#98968e}.pvh-icon{font-size:24px;color:${GOLD};margin-bottom:18px}
      .pvh-statement{padding:110px 0;border-block:1px solid rgba(214,181,95,.14);background:radial-gradient(circle at 72% 44%,rgba(214,181,95,.11),transparent 38%),#0a0c0a}.pvh-statement-grid{display:grid;grid-template-columns:1fr .9fr;gap:50px;align-items:center}.pvh-formula{height:420px;border:1px solid rgba(214,181,95,.18);border-radius:28px;position:relative;overflow:hidden;background:linear-gradient(140deg,rgba(214,181,95,.08),rgba(255,255,255,.015))}.pvh-float{position:absolute;color:rgba(214,181,95,.32);font-family:Georgia,serif;animation:pvhFloat 6s ease-in-out infinite}.pvh-float:nth-child(2){animation-delay:-2s}.pvh-float:nth-child(3){animation-delay:-4s}@keyframes pvhFloat{50%{transform:translateY(-16px) rotate(3deg)}}
      .pvh-process{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}.pvh-step{padding:30px 24px;border-top:1px solid rgba(214,181,95,.35);background:linear-gradient(180deg,rgba(214,181,95,.045),transparent)}.pvh-step b{font-size:12px;color:${GOLD};letter-spacing:.13em}.pvh-step h4{font-size:21px;margin:18px 0 9px}.pvh-step p{font-size:14px;line-height:1.65;color:#9d9a91;margin:0}
      .pvh-cta{margin:15px 0 92px;padding:54px;border:1px solid rgba(214,181,95,.24);border-radius:28px;background:linear-gradient(120deg,rgba(214,181,95,.12),rgba(255,255,255,.02));display:flex;align-items:center;justify-content:space-between;gap:30px}.pvh-cta h3{font-size:clamp(30px,4vw,54px);margin:0;letter-spacing:-.04em}.pvh-actions{display:flex;gap:12px;flex-wrap:wrap}.pvh-btn{border:1px solid rgba(214,181,95,.5);border-radius:12px;padding:15px 21px;background:transparent;color:#f7f0df;font-weight:800;cursor:pointer;transition:.25s}.pvh-btn.primary{background:${GOLD};color:#11130f;border-color:${GOLD}}.pvh-btn:hover{transform:translateY(-2px);filter:brightness(1.06)}
      .pvh-reveal{opacity:0;transform:translateY(24px);transition:.7s cubic-bezier(.2,.8,.2,1)}.pvh-reveal.in{opacity:1;transform:none}
      @media(max-width:900px){.pvh-section{padding:65px 0}.pvh-services{display:block}.pvh-card{margin-bottom:14px;min-height:320px}.pvh-why,.pvh-statement-grid{grid-template-columns:1fr;gap:38px}.pvh-process{grid-template-columns:1fr 1fr}.pvh-cta{padding:34px;display:block}.pvh-actions{margin-top:25px}.pvh-formula{height:320px}}
      @media(max-width:560px){.pvh-benefits,.pvh-process{grid-template-columns:1fr}.pvh-title{font-size:42px}.pvh-wrap{width:min(92vw,700px)}.pvh-cta{margin-bottom:55px}}
      @media(prefers-reduced-motion:reduce){.pvh-track,.pvh-float{animation:none!important}.pvh-reveal{opacity:1;transform:none;transition:none}}
    `;document.head.appendChild(style);
  }
  function markup(){return `
    <div class="pvh-marquee"><div class="pvh-track">${Array(2).fill('<span>Akademik Koçluk</span><b>✦</b><span>Enstrüman Eğitimi</span><b>✦</b><span>Prodüktörlük</span><b>✦</b><span>Stüdyo Kaydı</span><b>✦</b><span>Organizasyon</span><b>✦</b>').join('')}</div></div>
    <section class="pvh-section"><div class="pvh-wrap pvh-reveal"><div class="pvh-kicker">Pİ-RE’yi keşfet</div><h2 class="pvh-title">Tek çatı altında <em>öğren, üret, sahneye çık.</em></h2><p class="pvh-sub">Akademik gelişimden enstrüman eğitimine, profesyonel kayıttan organizasyona uzanan bütünlüklü bir atölye deneyimi.</p>
      <div class="pvh-services">
        <article class="pvh-card big" data-go="academic" tabindex="0"><div class="pvh-card-media" style="background-image:linear-gradient(120deg,#111b14aa,#0008),url('/chemistry-lab.png')"></div><span class="pvh-arrow">↗</span><div class="pvh-card-body"><div class="pvh-card-num">01 / AKADEMİK</div><h3>Akademik Koçluk</h3><p>Hedefe özel plan, düzenli takip ve sürdürülebilir çalışma alışkanlığı.</p></div></article>
        <article class="pvh-card small" data-go="instrument" tabindex="0"><div class="pvh-card-media" style="background-image:linear-gradient(120deg,#171006aa,#0008),url('/guitar-student.png')"></div><span class="pvh-arrow">↗</span><div class="pvh-card-body"><div class="pvh-card-num">02 / MÜZİK</div><h3>Enstrüman Eğitimi</h3><p>Her yaş ve seviyeye uygun, bireysel hedeflerle ilerleyen eğitim.</p></div></article>
        <article class="pvh-card small" data-go="production" tabindex="0"><div class="pvh-card-media" style="background:radial-gradient(circle at 70% 30%,#6f571f88,transparent 26%),linear-gradient(145deg,#16130c,#080907)"></div><span class="pvh-arrow">↗</span><div class="pvh-card-body"><div class="pvh-card-num">03 / ÜRETİM</div><h3>Prodüktörlük & Stüdyo</h3><p>Fikirden kayda, düzenlemeden tamamlanmış esere uzanan yaratıcı süreç.</p></div></article>
        <article class="pvh-card big" data-go="event" tabindex="0"><div class="pvh-card-media" style="background:radial-gradient(circle at 32% 42%,#7e632a66,transparent 20%),radial-gradient(circle at 75% 28%,#d6b55f33,transparent 18%),linear-gradient(145deg,#111410,#070807)"></div><span class="pvh-arrow">↗</span><div class="pvh-card-body"><div class="pvh-card-num">04 / SAHNE</div><h3>Organizasyon</h3><p>Sahne, etkinlik ve yaratıcı buluşmalar için uçtan uca çözümler.</p></div></article>
      </div>
    </div></section>
    <section class="pvh-section"><div class="pvh-wrap pvh-why pvh-reveal"><div><div class="pvh-kicker">Neden Pİ-RE?</div><h2 class="pvh-title">Standart program değil, <em>sana göre yol haritası.</em></h2><p class="pvh-sub">Eğitim ve üretimi birbirinden ayırmayan; öğrencinin hedefini, temposunu ve ilgisini merkeze alan bir atölye yaklaşımı.</p></div><div class="pvh-benefits"><div class="pvh-benefit"><div class="pvh-icon">◎</div><strong>Kişiye özel program</strong><span>Seviye ve hedefe göre şekillenen çalışma planı.</span></div><div class="pvh-benefit"><div class="pvh-icon">↗</div><strong>Düzenli gelişim takibi</strong><span>İlerlemeyi görünür kılan takip ve geri bildirim.</span></div><div class="pvh-benefit"><div class="pvh-icon">♫</div><strong>Disiplinler arası ortam</strong><span>Matematik, müzik ve üretimin aynı kültürde buluşması.</span></div><div class="pvh-benefit"><div class="pvh-icon">✦</div><strong>Üretime dönük eğitim</strong><span>Öğrenilenin proje, kayıt ve sahne deneyimine dönüşmesi.</span></div></div></div></section>
    <section class="pvh-statement"><div class="pvh-wrap pvh-statement-grid pvh-reveal"><div><div class="pvh-kicker">Aynı ritimde</div><h2 class="pvh-title">Analitik düşünce ile <em>yaratıcılık</em> birbirini besler.</h2><p class="pvh-sub">Pİ-RE’de amaç yalnızca bir konuyu öğrenmek ya da bir parçayı çalmak değil; düşünme, üretme ve kendini ifade etme becerisini birlikte büyütmek.</p></div><div class="pvh-formula"><span class="pvh-float" style="font-size:84px;left:10%;top:16%">π</span><span class="pvh-float" style="font-size:92px;right:13%;top:22%">♫</span><span class="pvh-float" style="font-size:58px;left:37%;bottom:14%">f(x)</span><span class="pvh-float" style="font-size:64px;right:28%;bottom:21%">𝄞</span></div></div></section>
    <section class="pvh-section"><div class="pvh-wrap pvh-reveal"><div class="pvh-kicker">Nasıl ilerliyoruz?</div><h2 class="pvh-title">İlk görüşmeden <em>gelişim takibine.</em></h2><div class="pvh-process"><div class="pvh-step"><b>01</b><h4>Tanışma</h4><p>Hedefi, ihtiyacı ve beklentiyi birlikte netleştiriyoruz.</p></div><div class="pvh-step"><b>02</b><h4>Program</h4><p>Kişiye uygun eğitim veya üretim planını oluşturuyoruz.</p></div><div class="pvh-step"><b>03</b><h4>Uygulama</h4><p>Ders, prova, proje veya kayıt süreci düzenli ilerliyor.</p></div><div class="pvh-step"><b>04</b><h4>Takip</h4><p>Gelişimi izliyor, ihtiyaç oldukça programı güncelliyoruz.</p></div></div></div></section>
    <div class="pvh-wrap pvh-reveal"><section class="pvh-cta"><div><div class="pvh-kicker">Birlikte başlayalım</div><h3>Hangi alanda ilerlemek istiyorsun?</h3></div><div class="pvh-actions"><button class="pvh-btn primary" data-go="contact">Bize ulaşın ↗</button><button class="pvh-btn" data-go="instrument">Eğitimleri incele</button></div></section></div>
  `}
  function mount(){
    const current=document.getElementById('pire-vh2');
    if(!isVisitorHome()){if(current)current.style.display='none';return}
    css();
    if(current){current.style.display='block';return}
    const heroTitle=[...document.querySelectorAll('h1')].find(x=>/Matematik ve müziğin|mathematics and music/i.test(norm(x.textContent)));
    if(!heroTitle)return;
    let hero=heroTitle.closest('section');
    if(!hero){let p=heroTitle.parentElement;while(p&&p.parentElement&&!['MAIN','BODY'].includes(p.parentElement.tagName))p=p.parentElement;hero=p}
    const root=document.createElement('div');root.id='pire-vh2';root.innerHTML=markup();
    if(hero&&hero.parentNode)hero.insertAdjacentElement('afterend',root);else (document.querySelector('main')||document.body).appendChild(root);
    root.addEventListener('click',e=>{const hit=e.target.closest('[data-go]');if(hit)go(hit.dataset.go)});
    root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-go]')){e.preventDefault();go(e.target.dataset.go)}});
    const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting)x.target.classList.add('in')}),{threshold:.12});root.querySelectorAll('.pvh-reveal').forEach(x=>io.observe(x));
  }
  let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
