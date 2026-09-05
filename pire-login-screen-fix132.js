(()=>{
'use strict';
if(window.__PIRE_LOGIN_SCREEN_FIX132_V4__)return;
window.__PIRE_LOGIN_SCREEN_FIX132_V4__=true;
const style=document.createElement('style');
style.id='pire-login132-v4-style';
style.textContent=`
.visitor-login-backdrop{padding:22px!important;box-sizing:border-box!important}
.visitor-login-dialog{width:min(1020px,calc(100vw - 44px))!important;max-width:1020px!important;max-height:92vh!important;padding:30px 34px 26px!important;border-radius:26px!important;border:1px solid rgba(214,181,95,.34)!important;background:radial-gradient(circle at 10% 0%,rgba(214,181,95,.09),transparent 32%),linear-gradient(155deg,#171a18 0%,#0c0f0d 78%)!important;box-shadow:0 34px 110px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.04)!important;box-sizing:border-box!important;overflow:auto!important}
.visitor-login-close{width:46px!important;height:46px!important;min-width:46px!important;border-radius:13px!important;display:grid!important;place-items:center!important;top:22px!important;right:22px!important}
.visitor-login-brand{margin:0 0 30px!important;min-height:54px!important;display:flex!important;align-items:center!important}
.visitor-login-heading{margin:0!important;max-width:760px!important}
.visitor-login-heading small{display:block!important;margin-bottom:10px!important;letter-spacing:.18em!important}
.visitor-login-heading h2{font-size:40px!important;line-height:1.04!important;letter-spacing:-.045em!important;margin:0 0 10px!important;font-weight:780!important}
.visitor-login-heading p{font-size:14px!important;line-height:1.55!important;margin:0!important;color:rgba(240,236,226,.58)!important}
.visitor-role-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px!important;width:100%!important;margin:24px 0 0!important}
.visitor-role-grid>button{width:100%!important;min-width:0!important;min-height:126px!important;height:126px!important;padding:18px 16px!important;border-radius:14px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:space-between!important;text-align:left!important;background:rgba(255,255,255,.018)!important;border:1px solid rgba(255,255,255,.09)!important;transition:transform .16s ease,border-color .16s ease,background .16s ease!important}
.visitor-role-grid>button:hover{transform:translateY(-2px)!important;border-color:rgba(214,181,95,.48)!important;background:rgba(214,181,95,.055)!important}
.visitor-role-grid>button.active{border-color:#d6b55f!important;background:linear-gradient(145deg,rgba(214,181,95,.18),rgba(214,181,95,.065))!important;box-shadow:inset 0 0 0 1px rgba(214,181,95,.08),0 10px 26px rgba(0,0,0,.16)!important}
.visitor-login-form{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px 16px!important;width:100%!important;margin-top:24px!important;padding-top:22px!important;border-top:1px solid rgba(214,181,95,.17)!important;box-sizing:border-box!important}
.visitor-login-form>label{display:flex!important;flex-direction:column!important;gap:7px!important;margin:0!important;min-width:0!important;width:100%!important}
.visitor-login-form>label>span{font-size:12px!important;line-height:1.2!important;margin:0!important}
.visitor-login-form>label>input,.visitor-password-field{width:100%!important;height:58px!important;min-height:58px!important;box-sizing:border-box!important;border-radius:12px!important;margin:0!important}
.visitor-login-form>label>input{padding:0 16px!important;font-size:15px!important}
.visitor-password-field{display:flex!important;align-items:center!important;overflow:hidden!important}
.visitor-password-field input{height:56px!important;min-height:56px!important;flex:1 1 auto!important;min-width:0!important;padding:0 16px!important;font-size:15px!important;box-sizing:border-box!important}
.visitor-password-field button{height:56px!important;min-width:70px!important;padding:0 14px!important;align-self:stretch!important}
.visitor-login-options,.visitor-login-error,.visitor-login-message,.visitor-login-submit,.visitor-setup-switch,.visitor-login-preview-note{grid-column:1/-1!important}
.visitor-login-options{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:34px!important;margin:0!important;padding:0!important}
.visitor-login-submit{width:100%!important;height:62px!important;min-height:62px!important;margin:0!important;border-radius:12px!important;padding:0 22px!important;font-size:15px!important;font-weight:800!important;box-shadow:0 12px 30px rgba(214,181,95,.14)!important}
.visitor-setup-switch{display:flex!important;justify-content:center!important;align-items:center!important;width:max-content!important;max-width:100%!important;margin:4px auto 0!important;padding:6px 8px!important}
.visitor-login-preview-note{display:block!important;text-align:center!important;max-width:760px!important;width:100%!important;margin:0 auto!important;line-height:1.45!important}
@media(max-width:920px){.visitor-role-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.visitor-role-grid>button{height:112px!important;min-height:112px!important}}
@media(max-width:700px){.visitor-login-backdrop{padding:12px!important}.visitor-login-dialog{width:calc(100vw - 24px)!important;padding:24px 20px 22px!important;border-radius:20px!important}.visitor-login-brand{margin-bottom:24px!important}.visitor-login-heading h2{font-size:34px!important}.visitor-role-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.visitor-login-form{grid-template-columns:1fr!important}.visitor-login-form>label,.visitor-login-options,.visitor-login-error,.visitor-login-message,.visitor-login-submit,.visitor-setup-switch,.visitor-login-preview-note{grid-column:1!important}}
@media(max-width:430px){.visitor-role-grid{grid-template-columns:1fr!important}.visitor-role-grid>button{height:96px!important;min-height:96px!important}}
`;
(document.head||document.documentElement).appendChild(style);
})();