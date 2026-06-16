import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR = new Date().getFullYear();
const INCOME_CATEGORIES = ["Зарплата","Фриланс","Подработка","Инвестиции","Другое"];
const EXPENSE_CATEGORIES = ["Жильё","Еда","Транспорт","Здоровье","Развлечения","Одежда","Подписки","Другое"];

const P = {
  income:"#F5C842", expense:"#E05A3A", balance:"#4A90D9", savings:"#72C47D",
  bg:"#111111", surface:"#1A1A1A", border:"#2A2A2A",
  text:"#F0F0F0", muted:"#888888",
  cats:["#F5C842","#E05A3A","#4A90D9","#72C47D","#B06CE8","#F0935A","#60C9C2","#E872A8","#A0B4CC"],
};

const fmt = n => (!n&&n!==0)||isNaN(n)?"0 ₽":new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(n);

let _id = 100;
const uid = () => _id++;

const DEMO_TX = [
  {id:1,type:"income",category:"Зарплата",amount:85000,month:CURRENT_MONTH,year:CURRENT_YEAR,note:"Основная зарплата"},
  {id:2,type:"income",category:"Фриланс",amount:25000,month:CURRENT_MONTH,year:CURRENT_YEAR,note:"Проект логотипа"},
  {id:3,type:"expense",category:"Жильё",amount:30000,month:CURRENT_MONTH,year:CURRENT_YEAR,note:"Аренда"},
  {id:4,type:"expense",category:"Еда",amount:18000,month:CURRENT_MONTH,year:CURRENT_YEAR,note:""},
  {id:5,type:"expense",category:"Транспорт",amount:4500,month:CURRENT_MONTH,year:CURRENT_YEAR,note:""},
  {id:6,type:"expense",category:"Подписки",amount:2100,month:CURRENT_MONTH,year:CURRENT_YEAR,note:"Figma, Spotify"},
  {id:7,type:"expense",category:"Развлечения",amount:5500,month:CURRENT_MONTH,year:CURRENT_YEAR,note:""},
  {id:8,type:"income",category:"Зарплата",amount:85000,month:(CURRENT_MONTH-1+12)%12,year:CURRENT_YEAR,note:""},
  {id:9,type:"expense",category:"Жильё",amount:30000,month:(CURRENT_MONTH-1+12)%12,year:CURRENT_YEAR,note:""},
  {id:10,type:"expense",category:"Еда",amount:20000,month:(CURRENT_MONTH-1+12)%12,year:CURRENT_YEAR,note:""},
  {id:11,type:"expense",category:"Одежда",amount:12000,month:(CURRENT_MONTH-1+12)%12,year:CURRENT_YEAR,note:""},
  {id:12,type:"income",category:"Фриланс",amount:15000,month:(CURRENT_MONTH-1+12)%12,year:CURRENT_YEAR,note:""},
  {id:13,type:"income",category:"Зарплата",amount:85000,month:(CURRENT_MONTH-2+12)%12,year:CURRENT_YEAR,note:""},
  {id:14,type:"expense",category:"Жильё",amount:30000,month:(CURRENT_MONTH-2+12)%12,year:CURRENT_YEAR,note:""},
  {id:15,type:"expense",category:"Здоровье",amount:7000,month:(CURRENT_MONTH-2+12)%12,year:CURRENT_YEAR,note:""},
  {id:16,type:"expense",category:"Еда",amount:16000,month:(CURRENT_MONTH-2+12)%12,year:CURRENT_YEAR,note:""},
];

const DEMO_GOALS = [
  {id:"g1",name:"Отпуск 🌊",target:120000,saved:42000,color:"#4A90D9",deadline:"2025-08"},
  {id:"g2",name:"Новый ноут 💻",target:80000,saved:65000,color:"#B06CE8",deadline:"2025-07"},
  {id:"g3",name:"Подушка безопасности 🛡️",target:300000,saved:95000,color:"#72C47D",deadline:""},
];

const DEFAULT_SPLIT = [
  {id:1,label:"Жильё",     category:"Жильё",       pct:30,type:"expense",goalId:null},
  {id:2,label:"Еда",       category:"Еда",          pct:15,type:"expense",goalId:null},
  {id:3,label:"Транспорт", category:"Транспорт",    pct:5, type:"expense",goalId:null},
  {id:4,label:"Подписки",  category:"Подписки",     pct:3, type:"expense",goalId:null},
  {id:5,label:"Развлечения",category:"Развлечения", pct:7, type:"expense",goalId:null},
  {id:6,label:"Накопления",category:null,           pct:20,type:"saving", goalId:"g3"},
  {id:7,label:"Отпуск",   category:null,            pct:10,type:"saving", goalId:"g1"},
  {id:8,label:"Свободные", category:"Другое",       pct:10,type:"expense",goalId:null},
];

const Tip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return <div style={{background:"#222",border:"1px solid #333",borderRadius:8,padding:"10px 14px",fontSize:13}}>
    <div style={{color:"#aaa",marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||"#fff"}}>{p.name}: {fmt(p.value)}</div>)}
  </div>;
};

const inp = {background:"#1e1e1e",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"8px 11px",fontSize:13,width:"100%",boxSizing:"border-box"};
const card = {background:P.surface,borderRadius:12,padding:16,border:`1px solid ${P.border}`};
const lbl = {fontSize:11,color:P.muted,marginBottom:3,display:"block"};
const btn = (c,ghost) => ({background:ghost?"transparent":c,color:ghost?c:"#111",border:`1.5px solid ${c}`,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"});
const badge = t => ({display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,
  background:t==="income"?"rgba(245,200,66,0.13)":t==="saving"?"rgba(114,196,125,0.13)":"rgba(224,90,58,0.13)",
  color:t==="income"?P.income:t==="saving"?P.savings:P.expense});
const kpi = c => ({background:P.surface,borderRadius:10,padding:"14px 16px",borderLeft:`3px solid ${c}`});

export default function App() {
  const [tx,setTx] = useState(DEMO_TX);
  const [goals,setGoals] = useState(DEMO_GOALS);
  const [tab,setTab] = useState("overview");
  const [fMonth,setFMonth] = useState(CURRENT_MONTH);
  const [fYear,setFYear] = useState(CURRENT_YEAR);

  // tx form
  const [showTxForm,setShowTxForm] = useState(false);
  const [txF,setTxF] = useState({type:"expense",category:"",amount:"",month:CURRENT_MONTH,year:CURRENT_YEAR,note:""});
  const [editTxId,setEditTxId] = useState(null);

  // goal form
  const [showGF,setShowGF] = useState(false);
  const [gF,setGF] = useState({name:"",target:"",saved:"",color:"#4A90D9",deadline:""});
  const [editGId,setEditGId] = useState(null);
  const [topUpId,setTopUpId] = useState(null);
  const [topUpAmt,setTopUpAmt] = useState("");

  // split
  const [split,setSplit] = useState(DEFAULT_SPLIT);
  const [splitSal,setSplitSal] = useState("");
  const [splitPreview,setSplitPreview] = useState(null);
  const [editingTpl,setEditingTpl] = useState(false);

  // ── derived ──
  const view = useMemo(()=>tx.filter(t=>t.month===fMonth&&t.year===fYear),[tx,fMonth,fYear]);
  const totInc = useMemo(()=>view.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),[view]);
  const totExp = useMemo(()=>view.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),[view]);
  const bal = totInc-totExp;

  const monthly = useMemo(()=>{
    const r=[];
    for(let i=5;i>=0;i--){
      let m=CURRENT_MONTH-i,y=CURRENT_YEAR;
      if(m<0){m+=12;y--;}
      const inc=tx.filter(t=>t.month===m&&t.year===y&&t.type==="income").reduce((s,t)=>s+t.amount,0);
      const exp=tx.filter(t=>t.month===m&&t.year===y&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
      r.push({name:MONTHS[m],income:inc,expense:exp,balance:inc-exp});
    }
    return r;
  },[tx]);

  const catData = useMemo(()=>{
    const m={};
    view.filter(t=>t.type==="expense").forEach(t=>{m[t.category]=(m[t.category]||0)+t.amount;});
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[view]);

  const totSaved = useMemo(()=>goals.reduce((s,g)=>s+g.saved,0),[goals]);
  const totTarget = useMemo(()=>goals.reduce((s,g)=>s+g.target,0),[goals]);
  const splitTotal = useMemo(()=>split.reduce((s,r)=>s+r.pct,0),[split]);

  // ── tx helpers ──
  function saveTx(){
    if(!txF.category||!txF.amount||isNaN(+txF.amount)||+txF.amount<=0) return;
    if(editTxId!==null){setTx(t=>t.map(x=>x.id===editTxId?{...txF,amount:+txF.amount,id:editTxId}:x));setEditTxId(null);}
    else setTx(t=>[...t,{...txF,amount:+txF.amount,id:uid()}]);
    setTxF({type:"expense",category:"",amount:"",month:CURRENT_MONTH,year:CURRENT_YEAR,note:""});
    setShowTxForm(false);
  }
  function editTx(t){setTxF({...t,amount:String(t.amount)});setEditTxId(t.id);setShowTxForm(true);}
  function delTx(id){setTx(t=>t.filter(x=>x.id!==id));}

  // ── goal helpers ──
  function saveGoal(){
    if(!gF.name||!gF.target||+gF.target<=0) return;
    const obj={...gF,target:+gF.target,saved:+gF.saved||0};
    if(editGId){setGoals(g=>g.map(x=>x.id===editGId?{...obj,id:editGId}:x));setEditGId(null);}
    else setGoals(g=>[...g,{...obj,id:"g"+uid()}]);
    setGF({name:"",target:"",saved:"",color:"#4A90D9",deadline:""});setShowGF(false);
  }
  function editGoal(g){setGF({...g,target:String(g.target),saved:String(g.saved)});setEditGId(g.id);setShowGF(true);}
  function delGoal(id){setGoals(g=>g.filter(x=>x.id!==id));}
  function confirmTopUp(){
    const a=+topUpAmt;
    if(!a||a<=0) return;
    setGoals(g=>g.map(x=>x.id===topUpId?{...x,saved:x.saved+a}:x));
    setTopUpId(null);setTopUpAmt("");
  }

  // ── split helpers ──
  function calcSplit(){
    const sal=+splitSal;
    if(!sal||sal<=0||splitTotal!==100) return;
    setSplitPreview(split.map(r=>({...r,amount:Math.round(sal*r.pct/100)})));
  }
  function applySplit(){
    if(!splitPreview) return;
    const sal=+splitSal;
    setTx(t=>[...t,{id:uid(),type:"income",category:"Зарплата",amount:sal,month:fMonth,year:fYear,note:"Зарплата (распределение)"}]);
    splitPreview.forEach(r=>{
      if(r.type==="expense") setTx(t=>[...t,{id:uid(),type:"expense",category:r.category,amount:r.amount,month:fMonth,year:fYear,note:r.label}]);
      else if(r.type==="saving"&&r.goalId) setGoals(g=>g.map(x=>x.id===r.goalId?{...x,saved:x.saved+r.amount}:x));
    });
    setSplitPreview(null);setSplitSal("");
  }
  function updateRow(id,field,val){
    setSplit(rows=>rows.map(r=>r.id===id?{...r,[field]:field==="pct"?+val||0:val}:r));
  }

  const cats = txF.type==="income"?INCOME_CATEGORIES:EXPENSE_CATEGORIES;

  return (
    <div style={{background:P.bg,minHeight:"100vh",color:P.text,fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:48}}>

      {/* Header */}
      <div style={{padding:"22px 20px 0",borderBottom:`1px solid ${P.border}`}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.5px",marginBottom:2}}>Бюджет</div>
        <div style={{fontSize:12,color:P.muted,marginBottom:14}}>Личный финансовый трекер</div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {[["overview","Обзор"],["table","Транзакции"],["savings","Накопления"],["split","Зарплата"],["charts","Графики"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 14px",borderRadius:"7px 7px 0 0",fontSize:13,fontWeight:500,background:tab===k?P.surface:"transparent",color:tab===k?P.text:P.muted,border:"none",cursor:"pointer",borderTop:tab===k?`2px solid ${P.income}`:"2px solid transparent"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 20px 0"}}>

        {/* Month bar */}
        {tab!=="savings"&&tab!=="split"&&(
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:18,flexWrap:"wrap"}}>
            <select style={{background:"#1e1e1e",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fMonth} onChange={e=>setFMonth(+e.target.value)}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <select style={{background:"#1e1e1e",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fYear} onChange={e=>setFYear(+e.target.value)}>
              {[CURRENT_YEAR-1,CURRENT_YEAR,CURRENT_YEAR+1].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            {(tab==="overview"||tab==="table")&&<button style={btn(P.income)} onClick={()=>{setShowTxForm(true);setEditTxId(null);setTxF({type:"expense",category:"",amount:"",month:fMonth,year:fYear,note:""});}}>+ Добавить</button>}
          </div>
        )}

        {/* Tx form */}
        {showTxForm&&(
          <div style={{...card,marginBottom:18,border:`1px solid ${P.income}44`}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{editTxId?"Редактировать запись":"Новая запись"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Тип</label><select style={inp} value={txF.type} onChange={e=>setTxF(f=>({...f,type:e.target.value,category:""}))}>
                <option value="income">Доход</option><option value="expense">Расход</option></select></div>
              <div><label style={lbl}>Категория</label><select style={inp} value={txF.category} onChange={e=>setTxF(f=>({...f,category:e.target.value}))}>
                <option value="">— выбрать —</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Сумма, ₽</label><input style={inp} type="number" placeholder="0" value={txF.amount} onChange={e=>setTxF(f=>({...f,amount:e.target.value}))} /></div>
              <div><label style={lbl}>Заметка</label><input style={inp} type="text" placeholder="необязательно" value={txF.note} onChange={e=>setTxF(f=>({...f,note:e.target.value}))} /></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={btn(P.income)} onClick={saveTx}>{editTxId?"Сохранить":"Добавить"}</button>
              <button style={btn(P.muted,true)} onClick={()=>{setShowTxForm(false);setEditTxId(null);}}>Отмена</button>
            </div>
          </div>
        )}

        {/* KPI */}
        {(tab==="overview"||tab==="table")&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            <div style={kpi(P.income)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Доходы</div><div style={{fontSize:18,fontWeight:700,color:P.income}}>{fmt(totInc)}</div></div>
            <div style={kpi(P.expense)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Расходы</div><div style={{fontSize:18,fontWeight:700,color:P.expense}}>{fmt(totExp)}</div></div>
            <div style={kpi(bal>=0?P.balance:P.expense)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Остаток</div><div style={{fontSize:18,fontWeight:700,color:bal>=0?P.balance:P.expense}}>{fmt(bal)}</div></div>
          </div>
        )}

        {/* ─ OVERVIEW ─ */}
        {tab==="overview"&&(
          <>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Расходы по категориям</div>
              <div style={card}>
                {catData.length===0?<div style={{color:P.muted,fontSize:13}}>Нет расходов за этот месяц</div>
                  :catData.map((c,i)=>(
                    <div key={c.name} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                        <span style={{color:P.cats[i%P.cats.length]}}>{c.name}</span>
                        <span>{fmt(c.value)} <span style={{color:P.muted,fontSize:11}}>({totExp>0?Math.round(c.value/totExp*100):0}%)</span></span>
                      </div>
                      <div style={{height:5,background:"#2a2a2a",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${totExp>0?c.value/totExp*100:0}%`,background:P.cats[i%P.cats.length],borderRadius:4}} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Накопления — прогресс</div>
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                  <span style={{color:P.savings,fontWeight:600}}>{fmt(totSaved)}</span>
                  <span style={{color:P.muted}}>из {fmt(totTarget)}</span>
                </div>
                <div style={{height:6,background:"#2a2a2a",borderRadius:4,overflow:"hidden",marginBottom:14}}>
                  <div style={{height:"100%",width:`${totTarget>0?Math.min(totSaved/totTarget*100,100):0}%`,background:P.savings,borderRadius:4}} />
                </div>
                {goals.map(g=>{
                  const pct=g.target>0?Math.min(g.saved/g.target*100,100):0;
                  return <div key={g.id} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                      <span style={{color:g.color}}>{g.name}</span>
                      <span style={{color:P.muted}}>{fmt(g.saved)} / {fmt(g.target)}{g.deadline?` · ${g.deadline}`:""}</span>
                    </div>
                    <div style={{height:4,background:"#2a2a2a",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:g.color,borderRadius:3}} />
                    </div>
                  </div>;
                })}
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Последние операции</div>
              <div style={card}>
                {view.length===0?<div style={{color:P.muted,fontSize:13}}>Нет записей</div>
                  :[...view].reverse().slice(0,5).map((t,i,arr)=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                      <div><span style={badge(t.type)}>{t.category}</span>{t.note&&<span style={{color:P.muted,fontSize:12,marginLeft:8}}>{t.note}</span>}</div>
                      <span style={{fontWeight:600,color:t.type==="income"?P.income:P.expense}}>{t.type==="income"?"+":"−"}{fmt(t.amount)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}

        {/* ─ TABLE ─ */}
        {tab==="table"&&(
          <div style={{...card,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>
                {["Тип","Категория","Сумма","Заметка",""].map(h=><th key={h} style={{textAlign:"left",padding:"7px 9px",color:P.muted,fontWeight:500,borderBottom:`1px solid ${P.border}`,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {view.length===0
                  ?<tr><td colSpan={5} style={{padding:20,color:P.muted,textAlign:"center",fontSize:13}}>Нет записей. Нажмите «+ Добавить».</td></tr>
                  :[...view].reverse().map((t,i,arr)=>(
                    <tr key={t.id}>
                      <td style={{padding:"9px 9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}><span style={badge(t.type)}>{t.type==="income"?"Доход":"Расход"}</span></td>
                      <td style={{padding:"9px 9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>{t.category}</td>
                      <td style={{padding:"9px 9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",fontWeight:600,color:t.type==="income"?P.income:P.expense}}>{t.type==="income"?"+":"−"}{fmt(t.amount)}</td>
                      <td style={{padding:"9px 9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",color:P.muted}}>{t.note||"—"}</td>
                      <td style={{padding:"9px 9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                        <span style={{cursor:"pointer",marginRight:8}} onClick={()=>editTx(t)}>✏️</span>
                        <span style={{cursor:"pointer",color:P.expense}} onClick={()=>delTx(t.id)}>✕</span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ─ SAVINGS ─ */}
        {tab==="savings"&&(
          <>
            <div style={{display:"flex",alignItems:"center",marginBottom:16,marginTop:4}}>
              <div style={{fontSize:16,fontWeight:700}}>Цели накоплений</div>
              <button style={{...btn(P.savings),marginLeft:"auto"}} onClick={()=>{setShowGF(true);setEditGId(null);setGF({name:"",target:"",saved:"",color:"#4A90D9",deadline:""});}}>+ Новая цель</button>
            </div>

            {showGF&&(
              <div style={{...card,marginBottom:18,border:`1px solid ${P.savings}44`}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{editGId?"Редактировать цель":"Новая цель"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{gridColumn:"1/-1"}}><label style={lbl}>Название</label><input style={inp} placeholder="Например: Отпуск 🌊" value={gF.name} onChange={e=>setGF(f=>({...f,name:e.target.value}))} /></div>
                  <div><label style={lbl}>Цель, ₽</label><input style={inp} type="number" placeholder="100000" value={gF.target} onChange={e=>setGF(f=>({...f,target:e.target.value}))} /></div>
                  <div><label style={lbl}>Уже накоплено, ₽</label><input style={inp} type="number" placeholder="0" value={gF.saved} onChange={e=>setGF(f=>({...f,saved:e.target.value}))} /></div>
                  <div><label style={lbl}>Срок (ГГГГ-ММ)</label><input style={inp} placeholder="2025-12" value={gF.deadline} onChange={e=>setGF(f=>({...f,deadline:e.target.value}))} /></div>
                  <div><label style={lbl}>Цвет</label>
                    <div style={{display:"flex",gap:6,paddingTop:4}}>
                      {["#4A90D9","#72C47D","#B06CE8","#F5C842","#E05A3A","#60C9C2"].map(c=>(
                        <div key={c} onClick={()=>setGF(f=>({...f,color:c}))} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:gF.color===c?"2.5px solid #fff":"2.5px solid transparent"}} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:14}}>
                  <button style={btn(P.savings)} onClick={saveGoal}>{editGId?"Сохранить":"Создать"}</button>
                  <button style={btn(P.muted,true)} onClick={()=>{setShowGF(false);setEditGId(null);}}>Отмена</button>
                </div>
              </div>
            )}

            {topUpId&&(
              <div style={{...card,marginBottom:18,border:`1px solid ${P.savings}55`}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Пополнить: {goals.find(g=>g.id===topUpId)?.name}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input style={{...inp,width:150}} type="number" placeholder="Сумма ₽" value={topUpAmt} onChange={e=>setTopUpAmt(e.target.value)} />
                  <button style={btn(P.savings)} onClick={confirmTopUp}>Добавить</button>
                  <button style={btn(P.muted,true)} onClick={()=>{setTopUpId(null);setTopUpAmt("");}}>Отмена</button>
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              <div style={kpi(P.savings)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Накоплено всего</div><div style={{fontSize:18,fontWeight:700,color:P.savings}}>{fmt(totSaved)}</div></div>
              <div style={kpi(P.balance)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Осталось собрать</div><div style={{fontSize:18,fontWeight:700,color:P.balance}}>{fmt(Math.max(0,totTarget-totSaved))}</div></div>
            </div>

            {goals.length===0
              ?<div style={{...card,color:P.muted,fontSize:13}}>Нет целей. Нажмите «+ Новая цель».</div>
              :goals.map(g=>{
                const pct=g.target>0?Math.min(g.saved/g.target*100,100):0;
                const done=pct>=100;
                return (
                  <div key={g.id} style={{...card,marginBottom:12,borderLeft:`3px solid ${g.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{g.name}{done?" ✅":""}</div>
                        {g.deadline&&<div style={{fontSize:11,color:P.muted}}>Срок: {g.deadline}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <button style={{...btn(g.color),padding:"5px 10px",fontSize:12}} onClick={()=>{setTopUpId(g.id);setTopUpAmt("");}}>+ Пополнить</button>
                        <span style={{cursor:"pointer",fontSize:13,color:P.muted}} onClick={()=>editGoal(g)}>✏️</span>
                        <span style={{cursor:"pointer",fontSize:13,color:P.expense}} onClick={()=>delGoal(g.id)}>✕</span>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                      <span style={{color:g.color,fontWeight:600}}>{fmt(g.saved)}</span>
                      <span style={{color:P.muted}}>из {fmt(g.target)} · <span style={{color:done?P.savings:P.text}}>{Math.round(pct)}%</span></span>
                    </div>
                    <div style={{height:8,background:"#2a2a2a",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:g.color,borderRadius:4,transition:"width 0.4s"}} />
                    </div>
                    {!done&&<div style={{fontSize:11,color:P.muted,marginTop:4}}>Ещё {fmt(g.target-g.saved)}</div>}
                  </div>
                );
              })
            }
          </>
        )}

        {/* ─ SALARY SPLIT ─ */}
        {tab==="split"&&(
          <>
            <div style={{marginBottom:18,marginTop:4}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>Распределение зарплаты</div>
              <div style={{fontSize:13,color:P.muted}}>Введи сумму — трекер разобьёт её по категориям и целям, ты подтверждаешь.</div>
            </div>

            {/* Template */}
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em"}}>Шаблон</div>
                <button style={{...btn(editingTpl?P.savings:P.muted,!editingTpl),padding:"4px 10px",fontSize:11,marginLeft:"auto"}} onClick={()=>setEditingTpl(e=>!e)}>
                  {editingTpl?"Готово":"Изменить"}
                </button>
              </div>
              <div style={card}>
                {split.map((row,i,arr)=>(
                  <div key={row.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                    <div style={{flex:1,fontSize:13}}>{row.label}</div>
                    <span style={badge(row.type)}>{row.type==="saving"?"накопление":"расход"}</span>
                    {editingTpl
                      ?<input style={{...inp,width:58,textAlign:"right",padding:"5px 8px"}} type="number" value={row.pct} onChange={e=>updateRow(row.id,"pct",e.target.value)} />
                      :<span style={{fontWeight:600,fontSize:14,minWidth:36,textAlign:"right"}}>{row.pct}%</span>
                    }
                    {row.type==="saving"&&editingTpl&&(
                      <select style={{...inp,width:120,padding:"5px 8px"}} value={row.goalId||""} onChange={e=>updateRow(row.id,"goalId",e.target.value)}>
                        <option value="">— цель —</option>
                        {goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )}
                    {row.type==="saving"&&!editingTpl&&(
                      <span style={{fontSize:11,color:P.muted,minWidth:80,textAlign:"right"}}>→ {goals.find(g=>g.id===row.goalId)?.name||"без цели"}</span>
                    )}
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"flex-end",paddingTop:10,fontSize:12}}>
                  <span style={{color:splitTotal===100?P.savings:P.expense,fontWeight:600}}>Итого: {splitTotal}%{splitTotal!==100?` (нужно 100%)`:""}</span>
                </div>
              </div>
            </div>

            {/* Apply */}
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Применить к месяцу</div>
              <div style={card}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:splitPreview?16:0}}>
                  <select style={{background:"#1e1e1e",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fMonth} onChange={e=>setFMonth(+e.target.value)}>
                    {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                  </select>
                  <select style={{background:"#1e1e1e",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fYear} onChange={e=>setFYear(+e.target.value)}>
                    {[CURRENT_YEAR-1,CURRENT_YEAR,CURRENT_YEAR+1].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                  <input style={{...inp,width:160}} type="number" placeholder="Сумма зарплаты ₽" value={splitSal} onChange={e=>setSplitSal(e.target.value)} />
                  <button style={{...btn(P.income),opacity:splitTotal!==100?0.5:1}} onClick={calcSplit} disabled={splitTotal!==100}>Рассчитать</button>
                </div>

                {splitPreview&&(
                  <>
                    <div style={{fontSize:12,color:P.muted,marginBottom:10,paddingTop:4}}>Предпросмотр — проверь перед применением:</div>
                    {splitPreview.map((row,i,arr)=>(
                      <div key={row.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",fontSize:13}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={badge(row.type)}>{row.type==="saving"?"накопление":"расход"}</span>
                          <span>{row.label}</span>
                          {row.type==="saving"&&<span style={{fontSize:11,color:P.muted}}>→ {goals.find(g=>g.id===row.goalId)?.name||"без цели"}</span>}
                        </div>
                        <span style={{fontWeight:600,color:row.type==="saving"?P.savings:P.expense}}>{fmt(row.amount)}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:14}}>
                      <button style={btn(P.income)} onClick={applySplit}>✓ Применить всё</button>
                      <button style={btn(P.muted,true)} onClick={()=>setSplitPreview(null)}>Отмена</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─ CHARTS ─ */}
        {tab==="charts"&&(
          <>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Доходы и расходы за 6 месяцев</div>
              <div style={card}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={monthly} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="name" tick={{fill:P.muted,fontSize:12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:P.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}к`:v} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:12,color:P.muted}} />
                    <Bar dataKey="income" name="Доходы" fill={P.income} radius={[4,4,0,0]} />
                    <Bar dataKey="expense" name="Расходы" fill={P.expense} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Остаток по месяцам</div>
              <div style={card}>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="name" tick={{fill:P.muted,fontSize:12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:P.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}к`:v} />
                    <Tooltip content={<Tip />} />
                    <Line type="monotone" dataKey="balance" name="Остаток" stroke={P.balance} strokeWidth={2.5} dot={{fill:P.balance,r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Расходы по категориям — {MONTHS[fMonth]}</div>
              <div style={card}>
                {catData.length===0?<div style={{color:P.muted,fontSize:13}}>Нет расходов</div>
                  :<ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                        {catData.map((_,i)=><Cell key={i} fill={P.cats[i%P.cats.length]} />)}
                      </Pie>
                      <Tooltip formatter={v=>fmt(v)} />
                      <Legend wrapperStyle={{fontSize:12,color:P.muted}} />
                    </PieChart>
                  </ResponsiveContainer>
                }
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
