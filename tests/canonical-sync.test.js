"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {sanitizeSnapshot,parseCourses}=require("../api/canonical-sync")._test;

test("parseCourses JSON ve CSV girdilerini normalize eder",()=>{
  assert.deepEqual(parseCourses('["Matematik","Bağlama"]'),["Matematik","Bağlama"]);
  assert.deepEqual(parseCourses("Gitar, Piyano"),["Gitar","Piyano"]);
});

test("sanitizeSnapshot öğrenci kimliğini ve hassas alanları canonical modele taşır",()=>{
  const out=sanitizeSnapshot({students:{students:[{
    id:9201,name:" Ece Aydın ",birthDate:"2012-05-14",phone:"05330000101",nationalId:"*******0001",
    guardianName:"Selin Aydın",guardianPhone:"05330000901",fee:3200,paymentDay:5,status:"Aktif"
  }]},catalog:{teachers:[],courses:[]}});
  assert.equal(out.students.length,1);
  assert.equal(out.students[0].id,9201);
  assert.equal(out.students[0].full_name,"Ece Aydın");
  assert.equal(out.students[0].monthly_fee,3200);
  assert.equal(out.students[0].national_id,"*******0001");
});

test("sanitizeSnapshot katalog derslerini büyük/küçük harf duyarsız tekilleştirir",()=>{
  const out=sanitizeSnapshot({students:{students:[]},catalog:{
    courses:[{name:"Matematik"},{name:"matematik"},{name:"Gitar"}],
    teachers:[{id:1,name:"Kadir",courses:'["Matematik","Bağlama"]',status:"Aktif"}]
  }});
  assert.deepEqual(out.courseNames,["Matematik","Gitar","Bağlama"]);
  assert.equal(out.teachers[0].courses.length,2);
});

test("geçersiz satırlar ve bilinmeyen statüler güvenli şekilde elenir/normalize edilir",()=>{
  const out=sanitizeSnapshot({students:{students:[{id:"x",name:"Bozuk"},{id:1,name:"Geçerli",paymentDay:99,status:"Bilinmeyen"}]},catalog:{teachers:[],courses:[]}});
  assert.equal(out.students.length,1);
  assert.equal(out.students[0].payment_day,1);
  assert.equal(out.students[0].status,"Aktif");
});
