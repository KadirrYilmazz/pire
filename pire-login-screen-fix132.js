(()=>{
'use strict';
if(window.__PIRE_LOGIN_SCREEN_FIX132_V5__)return;
window.__PIRE_LOGIN_SCREEN_FIX132_V5__=true;
const style=document.createElement('style');
style.id='pire-login132-v5-style';
style.textContent=`
.visitor-login-backdrop{padding:18px!important;box-sizing:border-box!important;background:rgba(3,5,4,.78)!important;backdrop-filter:blur(8px)!important}
.visitor-login-dialog{width:min(1040px,calc(100vw - 36px))!important;max-width:1040px!important;max-height:94vh!important;padding:32px 36px 28px!important;border-radius:28px!important;border:1px solid rgba(222,190,104,.48)!important;background:radial-gradient(circle at 11% 0%,rgba(222,190,104,.13),transparent 31%),linear-gradient(155deg,#181b19 0%,#0b0e0c 76%)!important;box-shadow:0 38px 120px rgba(0,0,0,.68),inset 0 1px rgba(255,255,255,.055),0 0 0 1px rgba(222,190,104,.04)!important;box-sizing:border-box!important;overflow:auto!important}
.visitor-login-close{width:48px!important;height:48px!important;min-width:48px!important;border-radius:14px!important;display:grid!important;place-items:center!important;top:22px!important;right:22px!important;border:1px solid rgba(255,255,255,.13)!important;background:rgba(255,255,255,.035)!important;color:#f4efe2!important;font-size:22px!important}
.visitor-login-brand{margin:0 0 30px!important;min-height:56px!important;display:flex!important;align-items:center!important;color:#f7f1e5!important}
.visitor-login-heading{margin:0!important;max-width:820px!important}
.visitor-login-heading small{display:block!important;margin-bottom:11px!important;letter-spacing:.19em!important;color:#d6b55f!important;font-size:11px!important;font-weight:800!important}
.visitor-login-heading h2{font-size:46px!important;line-height:1.02!important;letter-spacing:-.05em!important;margin:0 0 12px!important;font-weight:820!important;color:#fbf7ef!important;text-shadow:0 1px 0 rgba(255,255,255,.04)!important}
.visitor-login-heading p{font-size:16px!important;line-height:1.55!important;margin:0!important;color:rgba(244,240,231,.72)!important;font-weight:500!important}
.visitor-role-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;width:100%!important;margin:26px 0 0!important}
.visitor-role-grid>button{width:100%!important;min-width:0!important;min-height:140px!important;height:140px!important;padding:20px 18px!important;border-radius:16px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:space-between!important;text-align:left!important;background:linear-gradient(180deg,rgba(255,255,255,.038),rgba(255,255,255,.016))!important;border:1px solid rgba(255,255,255,.13)!important;box-shadow:inset 0 1px rgba(255,255,255,.025)!important;transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease!important;color:#f7f2e7!important}
.visitor-role-grid>button:hover{transform:translateY(-3px)!important;border-color:rgba(222,190,104,.68)!important;background:linear-gradient(180deg,rgba(222,190,104,.10),rgba(222,190,104,.035))!important;box-shadow:0 12px 30px rgba(0,0,0,.24)!important}
.visitor-role-grid>button.active{border-color:#ddb94f!important;background:radial-gradient(circle at 18% 15%,rgba(235,205,116,.20),transparent 54%),linear-gradient(145deg,rgba(214,181,95,.20),rgba(214,181,95,.07))!important;box-shadow:inset 0 0 0 1px rgba(235,205,116,.10),0 12px 34px rgba(0,0,0,.24),0 0 24px rgba(214,181,95,.08)!important}
.visitor-role-grid>button>*:first-child{color:#d6b55f!important;font-size:11px!important;font-weight:800!important;letter-spacing:.03em!important;opacity:1!important}
.visitor-role-grid>button strong,.visitor-role-grid>button b,.visitor-role-grid>button [class*="title"],.visitor-role-grid>button [class*="name"]{color:#fffaf0!important;font-size:19px!important;line-height:1.2!important;font-weight:800!important;opacity:1!important}
.visitor-role-grid>button p,.visitor-role-grid>button small,.visitor-role-grid>button [class*="desc"]{color:rgba(244,240,231,.67)!important;font-size:12px!important;line-height:1.45!important;font-weight:500!important;opacity:1!important}
.visitor-login-form{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px 18px!important;width:100%!important;margin-top:26px!important;padding-top:24px!important;border-top:1px solid rgba(222,190,104,.23)!important;box-sizing:border-box!important}
.visitor-login-form>label{display:flex!important;flex-direction:column!important;gap:8px!important;margin:0!important;min-width:0!important;width:100%!important;color:#eee8dc!important;font-weight:650!important}
.visitor-login-form>label>span{font-size:13px!important;line-height:1.2!important;margin:0!important;color:rgba(247,242,231,.82)!important}
.visitor-login-form>label>input,.visitor-password-field{width:100%!important;height:62px!important;min-height:62px!important;box-sizing:border-box!important;border-radius:13px!important;margin:0!important;background:#0a0d0b!important;border:1px solid rgba(255,255,255,.15)!important;color:#f8f4eb!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}
.visitor-login-form>label>input{padding:0 18px!important;font-size:16px!important}
.visitor-login-form input::placeholder{color:rgba(244,240,231,.48)!important;opacity:1!important}
.visitor-login-form>label>input:focus,.visitor-password-field:focus-within{outline:none!important;border-color:#d6b55f!important;box-shadow:0 0 0 3px rgba(214,181,95,.16),inset 0 1px 0 rgba(255,255,255,.03)!important}
.visitor-password-field{display:flex!important;align-items:center!important;overflow:hidden!important}
.visitor-password-field input{height:60px!important;min-height:60px!important;flex:1 1 auto!important;min-width:0!important;padding:0 18px!important;font-size:16px!important;box-sizing:border-box!important;color:#f8f4eb!important}
.visitor-password-field button{height:60px!important;min-width:76px!important;padding:0 14px!important;align-self:stretch!important;color:#d6b55f!important;font-weight:800!important}
.visitor-login-options,.visitor-login-error,.visitor-login-message,.visitor-login-submit,.visitor-setup-switch,.visitor-login-preview-note{grid-column:1/-1!important}
.visitor-login-options{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:38px!important;margin:0!important;padding:0!important;color:rgba(244,240,231,.72)!important;font-size:12px!important}
.visitor-login-options a,.visitor-login-options button{color:#d6b55f!important;font-weight:700!important}
.visitor-login-submit{width:100%!important;height:66px!important;min-height:66px!important;margin:2px 0 0!important;border-radius:13px!important;padding:0 24px!important;font-size:16px!important;font-weight:850!important;background:linear-gradient(90deg,#e1c071,#d6b55f)!important;color:#15130d!important;box-shadow:0 14px 34px rgba(214,181,95,.19),inset 0 1px rgba(255,255,255,.32)!important;letter-spacing:-.01em!important}
.visitor-login-submit:hover{filter:brightness(1.05)!important;transform:translateY(-1px)!important}
.visitor-setup-switch{display:flex!important;justify-content:center!important;align-items:center!important;width:max-content!important;max-width:100%!important;margin:6px auto 0!important;padding:6px 8px!important;color:#d6b55f!important;font-weight:700!important}
.visitor-login-preview-note{display:block!important;text-align:center!important;max-width:780px!important;width:100%!important;margin:0 auto!important;line-height:1.45!important;color:rgba(244,240,231,.46)!important;font-size:11px!important}
@media(max-width:920px){.visitor-role-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.visitor-role-grid>button{height:126px!important;min-height:126px!important}}
@media(max-width:700px){.visitor-login-backdrop{padding:10px!important}.visitor-login-dialog{width:calc(100vw - 20px)!important;padding:24px 20px 22px!important;border-radius:20px!important}.visitor-login-brand{margin-bottom:24px!important}.visitor-login-heading h2{font-size:36px!important}.visitor-login-heading p{font-size:14px!important}.visitor-login-form{grid-template-columns:1fr!important}.visitor-login-form>label,.visitor-login-options,.visitor-login-error,.visitor-login-message,.visitor-login-submit,.visitor-setup-switch,.visitor-login-preview-note{grid-column:1!important}}
@media(max-width:430px){.visitor-role-grid{grid-template-columns:1fr!important}.visitor-role-grid>button{height:108px!important;min-height:108px!important}}
`;
(document.head||document.documentElement).appendChild(style);
})();