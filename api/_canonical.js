"use strict";

const assistant=require("./assistant");
const {getVerifiedIdentity,originAllowed}=assistant._test;

function send(res,status,payload,headers={}){
  Object.entries({"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}).forEach(([k,v])=>res.setHeader(k,v));
  return res.status(status).json(payload);
}

function config(){
  const url=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Object.assign(new Error("Supabase sunucu ayarları eksik."),{status:503});
  return {url,key};
}

async function rest(token,path,options={}){
  const {url,key}=config();
  const response=await fetch(`${url}/rest/v1/${path}`,{
    ...options,
    headers:{
      apikey:key,
      Authorization:`Bearer ${token}`,
      Accept:"application/json",
      ...(options.body?{"content-type":"application/json"}:{}),
      ...(options.headers||{})
    }
  });
  if(!response.ok){
    const detail=await response.text().catch(()=>"");
    throw Object.assign(new Error("Canonical veri okunamadı."),{status:response.status===401||response.status===403?response.status:502,detail});
  }
  if(response.status===204)return null;
  return response.json().catch(()=>null);
}

function sameOrigin(req){
  const origin=String(req.headers.origin||"").trim();
  if(!origin)return false;
  const forwarded=String(req.headers["x-forwarded-host"]||"").split(",")[0].trim();
  const host=forwarded||String(req.headers.host||"").trim();
  if(!host)return false;
  try{return new URL(origin).host===host}catch(_){return false}
}

async function authenticate(req){
  if(!originAllowed(req)&&!sameOrigin(req))throw Object.assign(new Error("İstek kaynağına izin verilmiyor."),{status:403});
  const authorization=String(req.headers.authorization||"");
  if(!authorization.startsWith("Bearer "))throw Object.assign(new Error("Geçerli Pİ-RE oturumu gerekiyor."),{status:401});
  const token=authorization.slice(7).trim();
  const identity=await getVerifiedIdentity(token);
  return {token,identity};
}

function asNumber(value){const n=Number(value);return Number.isFinite(n)?n:0}
function dateOnly(value){return value?String(value).slice(0,10):null}
function timeOnly(value){return value?String(value).slice(0,5):""}

module.exports={send,rest,authenticate,asNumber,dateOnly,timeOnly,sameOrigin};
