"use strict";
/* AVT Check-in 1.0.0-test.9 — REINE Browser-Demo.
   Keine HTTP-Anfragen, keine Verbindung zu Google Apps Script, keine Live-Daten.
   Alle Daten befinden sich ausschließlich in localStorage dieses Browsers. */
window.AVT_BACKEND = (() => {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const DB_KEY = "avt-checkin-demo-test8-db-v1";
  const clone = U.clone;
  const counts = (adult=0, child=0, youth=0, student=0) => ({adult,child,youth,student});
  const now = () => new Date().toISOString();
  const err = (code, message) => Object.assign(new Error(message), {code});

  const EVENT_ID = "DEMO-STERNFUEHRUNG-TEST8";
  const demoRegistrations = [
    {eventId:EVENT_ID,token:"demo-anna",qrToken:"demo-anna",number:"A-01",ids:["A-01","A-02","A-03"],name:"Anna Beispiel",status:"confirmed",booked:counts(2,0,1,0)},
    {eventId:EVENT_ID,token:"demo-ben",qrToken:"demo-ben",number:"A-04",ids:["A-04"],name:"Ben Beispiel",status:"confirmed",booked:counts(1)},
    {eventId:EVENT_ID,token:"demo-clara",qrToken:"demo-clara",number:"A-05",ids:["A-05","A-06"],name:"Clara Mustermann",status:"confirmed",booked:counts(1,0,1,0)},
    {eventId:EVENT_ID,token:"demo-david",qrToken:"demo-david",number:"A-07",ids:["A-07","A-08"],name:"David Muster",status:"confirmed",booked:counts(2)},
    {eventId:EVENT_ID,token:"demo-erika",qrToken:"demo-erika",number:"W-01",ids:["W-01"],name:"Erika Beispiel",status:"waitlist",booked:counts(1)},
    {eventId:EVENT_ID,token:"demo-fritz",qrToken:"demo-fritz",number:"A-09",ids:["A-09"],name:"Fritz Test",status:"cancelled",booked:counts(1)}
  ];
  function newSeed() {
    const time = now();
    const checkin = {
      eventId:EVENT_ID, token:"demo-anna", operationId:"demo-ci-001",
      number:"A-01", ids:["A-01","A-02","A-03"], name:"Anna Beispiel",
      counts:counts(2,0,1,0), persons:3, kind:"regular", tariff:"regular",
      paid:12, basePrice:12, correctionReason:"", offline:false, voided:false,
      time, updatedAt:time
    };
    const checkin2 = {
      eventId:EVENT_ID, token:"demo-ben", operationId:"demo-ci-002",
      number:"A-04", ids:["A-04"], name:"Ben Beispiel",counts:counts(1),
      persons:1,kind:"regular",tariff:"regular",paid:5,basePrice:5,
      correctionReason:"",offline:false,voided:false,time,updatedAt:time
    };
    return {
      schema:1, closed:false,
      checkins:{"demo-anna":checkin,"demo-ben":checkin2}, manual:[],
      donations:[
        {eventId:EVENT_ID,operationId:"demo-sp-001",amount:10,time,updatedAt:time,voided:false,offline:false},
        {eventId:EVENT_ID,operationId:"demo-sp-002",amount:5,time,updatedAt:time,voided:false,offline:false}
      ], sequence:1, audit:[], operations:[]
    };
  }
  function db() {
    try {
      const parsed=JSON.parse(localStorage.getItem(DB_KEY) || "null");
      if (parsed?.schema===1 && parsed.checkins && Array.isArray(parsed.donations)) return parsed;
    } catch {}
    const result=newSeed();save(result);return result;
  }
  function save(value) { localStorage.setItem(DB_KEY,JSON.stringify(value)); }
  function snapshot() {
    const d=db();
    return {
      version:C.version,
      event:{id:EVENT_ID,title:"Sternführung – Demo",date:"2026-10-17",dateDisplay:"17.10.2026",time:"21:00",maxPersons:65,
        registrationEnabled:true,editingAllowed:!d.closed,
        editClosureReason:d.closed?"Demo-Veranstaltung hat den Status „durchgeführt“. Änderungen sind gesperrt.":""},
      prices:clone(C.prices),familyRule:clone(C.familyRule),correctionReasons:clone(C.correctionReasons),
      registrations:clone(demoRegistrations),
      data:clone({checkins:d.checkins,manual:d.manual,donations:d.donations,sequence:d.sequence})
    };
  }
  function uuid() { return "demo-op-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10); }
  function prepareOperation(action,payload={}) {
    return {operationId:payload.operationId || uuid(),action,payload:{...clone(payload),deviceId:"demo-browser"},createdAt:now()};
  }
  function money(value) {
    const n=Number(value);
    if (!Number.isFinite(n)||n<0||n>100000||Math.round(n*100)!==n*100 && Math.abs(n*100-Math.round(n*100))>1e-6)
      throw err("EDIT_INVALID_AMOUNT","Ungültiger Geldbetrag.");
    return Math.round(n*100)/100;
  }
  function normalizedCounts(incoming) {
    const result={};let total=0;
    for (const key of ["adult","child","youth","student"]) {
      const value=Number(incoming?.[key]);
      if (!Number.isInteger(value)||value<0||value>150) throw err("EDIT_INVALID_COUNT","Ungültige Personenzahl.");
      result[key]=value;total+=value;
    }
    if(total<1||total>150) throw err("EDIT_INVALID_COUNT","Zwischen 1 und 150 Personen erforderlich.");
    return result;
  }
  function tariffPrice(count,tariff) {
    const full=Object.keys(count).reduce((sum,k)=>sum+count[k]*Number(C.prices[k]||0),0);
    if (tariff==="regular") return full;
    if(tariff!=="family") throw err("EDIT_INVALID_TARIFF","Unbekannter Tarif.");
    if(count.adult<Number(C.familyRule.minAdults||1) || count.child+count.youth+count.student<Number(C.familyRule.minReducedPersons||1) ||
      (C.familyRule.requireRegularPriceAboveFamilyPrice !== false && full<=Number(C.prices.family)))
      throw err("EDIT_INVALID_TARIFF","Familientarif für diese Personenzahl nicht zulässig.");
    return Number(C.prices.family);
  }
  function validateAndEdit(d, op) {
    if(d.closed) throw err("EVENT_CLOSED","Die Veranstaltung hat den Status „durchgeführt“: Korrekturen sind gesperrt.");
    const edit=op.payload?.edit||{};
    const note=String(edit.reason||"").trim();
    if(note.length<3||note.length>500) throw err("EDIT_INVALID_REASON","Bitte mindestens drei Zeichen als Begründung angeben.");
    let original,updated;
    if(op.action==="editDonation") {
      const index=d.donations.findIndex(x=>x.operationId===edit.targetOperationId);
      if(index<0) throw err("EDIT_NOT_FOUND","Spende nicht gefunden.");
      original=d.donations[index];
      if(original.voided) throw err("EDIT_ALREADY_VOIDED","Spende wurde bereits storniert.");
      if(original.updatedAt!==edit.expectedUpdatedAt) throw err("EDIT_CONFLICT","Spende hat sich zwischenzeitlich geändert.");
      updated={...original,amount:edit.voided===true?0:money(edit.amount),voided:edit.voided===true,updatedAt:now()};
      if(!updated.voided&&updated.amount<=0) throw err("EDIT_INVALID_AMOUNT","Spendenbetrag muss größer 0 sein.");
      d.donations[index]=updated;
    } else {
      let key=Object.keys(d.checkins).find(k=>d.checkins[k].operationId===edit.targetOperationId&&d.checkins[k].token===edit.token);
      let manualIndex=-1;
      if(key===undefined) manualIndex=d.manual.findIndex(x=>x.operationId===edit.targetOperationId&&x.token===edit.token);
      if(key===undefined&&manualIndex<0) throw err("EDIT_NOT_FOUND","Check-in nicht gefunden.");
      original=key!==undefined?d.checkins[key]:d.manual[manualIndex];
      if(original.voided) throw err("EDIT_ALREADY_VOIDED","Check-in wurde bereits zurückgenommen.");
      if(original.updatedAt!==edit.expectedUpdatedAt) throw err("EDIT_CONFLICT","Check-in hat sich zwischenzeitlich geändert.");
      updated={...original,voided:edit.voided===true,updatedAt:now()};
      if(!updated.voided) {
        const revised=normalizedCounts(edit.counts);
        const base=tariffPrice(revised,edit.tariff);
        const paid=money(edit.paid);
        const correction=String(edit.correctionReason||"");
        if(paid!==base && !C.correctionReasons.some(reason=>reason.active!==false&&reason.id===correction))
          throw err("EDIT_PRICE_REASON","Für abweichenden Eintritt bitte Preis-Korrekturgrund wählen.");
        Object.assign(updated,{counts:revised,persons:U.sumCounts(revised),basePrice:base,paid,tariff:edit.tariff,
          correctionReason:paid!==base?correction:""});
      }
      if(key!==undefined) {
        if(updated.voided) delete d.checkins[key];
        else d.checkins[key]=updated;
      } else if(updated.voided) d.manual.splice(manualIndex,1);
      else d.manual[manualIndex]=updated;
    }
    d.audit.push({operationId:op.operationId,targetOperationId:edit.targetOperationId,
      action:op.action,reason:note,previous:clone(original),updated:clone(updated),time:now()});
    return {updated:clone(updated)};
  }
  function writeCheckin(d, op) {
    const item=clone(op.payload?.checkin||{});
    if(op.action==="checkinBatch") {
      const parts=Array.isArray(item.parts)?item.parts:[];
      if(!parts.length) throw err("INVALID_PAYLOAD","Keine Buchungsteile ausgewählt.");
      if(parts.some(part=>d.checkins[part.token])) throw err("CHECKIN_ALREADY_EXISTS","Buchungsteil wurde bereits eingecheckt.");
      for(const part of parts) {
        const record={...item,...part,operationId:op.operationId,eventId:EVENT_ID,time:now(),updatedAt:now(),offline:false,voided:false};
        delete record.parts;
        d.checkins[part.token]=record;
      }
      return {};
    }
    item.operationId=op.operationId;item.eventId=EVENT_ID;item.time=item.time||now();
    item.updatedAt=now();item.offline=false;item.voided=false;
    if(op.action==="manualCheckin") {
      item.token=item.id||item.token||uuid();
      item.number=item.number||item.token;
      if(d.manual.some(x=>x.id===item.id)) throw err("CHECKIN_ALREADY_EXISTS","Check-in existiert bereits.");
      d.manual.push(item);d.sequence++;
    } else {
      if(d.checkins[item.token]) throw err("CHECKIN_ALREADY_EXISTS","Diese Anmeldung wurde bereits eingecheckt.");
      d.checkins[item.token]=item;
    }
    return {};
  }
  function writeDonation(d,op) {
    const item=clone(op.payload?.donation||{});
    const amount=money(item.amount);
    if(amount<=0) throw err("INVALID_AMOUNT","Betrag muss positiv sein.");
    d.donations.push({...item,operationId:op.operationId,eventId:EVENT_ID,amount,time:item.time||now(),updatedAt:now(),voided:false,offline:false});
    return {};
  }
  async function sendPrepared(op) {
    const d=db();
    if(d.operations.includes(op.operationId)) return {ok:true,operation:op,duplicate:true};
    let result;
    if(op.action==="editCheckin"||op.action==="editDonation") result=validateAndEdit(d,op);
    else if(["checkin","manualCheckin","checkinBatch"].includes(op.action)) result=writeCheckin(d,op);
    else if(op.action==="donation") result=writeDonation(d,op);
    else throw err("ACTION_NOT_SUPPORTED","Dieser Vorgang ist in der Demo nicht verfügbar.");
    d.operations.push(op.operationId);
    save(d);
    // absichtlich KEINE Serverdaten in dieser Antwort, um das lokale UI nicht
    // mit Snapshots einer anderen Speicherrunde zu überschreiben.
    return {ok:true,...result,operation:op};
  }
  async function login(password,mode) {
    if(password!=="demo") throw err("LOGIN_FAILED","Demo-Passwort: demo");
    return {sessionToken:"demo-only-no-backend",expiresAt:mode==="permanent"?0:Date.now()+24*3600*1000};
  }
  const getQueue=()=>[];
  return {
    isConfigured:()=>true,
    isAuthError:e=>["LOGIN_FAILED","LOGIN_INVALID","LOGIN_EXPIRED","AUTH_REQUIRED"].includes(e?.code),
    login,logout:async()=>({ok:true}),ping:async()=>({ok:true}),
    bootstrap:async()=>snapshot(),state:async()=>snapshot(),
    request:async(action)=>action==="state"||action==="bootstrap"?{ok:true,data:snapshot()}:{ok:false},
    prepareOperation,sendPrepared,
    enqueuePrepared:()=>null,removeQueued:()=>{},isQueued:()=>false,
    getQueue,setQueue:()=>{},queueCount:()=>0,
    syncQueue:async()=>({ok:true,synced:0,failed:0,errors:[],syncedOperations:[]}),
    loadCached:()=>snapshot(),saveCached:()=>{},clearCached:()=>{},
    getDeviceId:()=>"demo-browser",newOperationId:uuid,
    resetDemo:()=>{save(newSeed());return snapshot();},
    getDemoClosed:()=>db().closed,
    setDemoClosed:value=>{const d=db();d.closed=Boolean(value);save(d);return snapshot();},
    getDemoAudit:()=>clone(db().audit)
  };
})();
