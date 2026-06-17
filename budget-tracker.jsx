import { useState, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const CM = new Date().getMonth();
const CY = new Date().getFullYear();

const P = {
  income:"#F9A86A", expense:"#F28BAD", balance:"#89C4E1", savings:"#A8D8A8",
  bg:"#FDF8F5", surface:"#FFFFFF", border:"#EDE8E3", text:"#2D2A27", muted:"#A89F97",
  cats:["#F9A86A","#F28BAD","#89C4E1","#A8D8A8","#C3A8D8","#F9D06A","#A8D4D8","#F4A8C8","#B8C8D8"],
};

const fmt = n => (!n && n!==0)||isNaN(n) ? "0 ₽"
  : new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(n);

let _id = Date.now();
const uid = () => ++_id;

function load(key, fb) { try { const v=localStorage.getItem(key); return v?JSON.parse(v):fb; } catch { return fb; } }
function save(key, val) { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} }

// ── Defaults ────────────────────────────────────────────────────
const DEFAULT_EXP_CATS = ["Жильё","Еда","Транспорт","Здоровье","Развлечения","Одежда","Подписки","Дом и быт","Красота","Кафе и рестораны","Другое"];
const DEFAULT_INC_CATS = ["Зарплата","Фриланс","Подработка","Инвестиции","Другое"];

const DEMO_TX = [
  {id:1,type:"income",category:"Зарплата",amount:85000,month:CM,year:CY,note:"Основная зарплата"},
  {id:2,type:"income",category:"Фриланс",amount:25000,month:CM,year:CY,note:"Проект логотипа"},
  {id:3,type:"expense",category:"Жильё",amount:30000,month:CM,year:CY,note:"Аренда"},
  {id:4,type:"expense",category:"Еда",amount:18000,month:CM,year:CY,note:""},
  {id:5,type:"expense",category:"Транспорт",amount:4500,month:CM,year:CY,note:""},
  {id:6,type:"expense",category:"Подписки",amount:2100,month:CM,year:CY,note:"Figma, Spotify"},
  {id:7,type:"expense",category:"Развлечения",amount:5500,month:CM,year:CY,note:""},
  {id:8,type:"income",category:"Зарплата",amount:85000,month:(CM-1+12)%12,year:CY,note:""},
  {id:9,type:"expense",category:"Жильё",amount:30000,month:(CM-1+12)%12,year:CY,note:""},
  {id:10,type:"expense",category:"Еда",amount:20000,month:(CM-1+12)%12,year:CY,note:""},
  {id:11,type:"expense",category:"Одежда",amount:12000,month:(CM-1+12)%12,year:CY,note:""},
  {id:12,type:"income",category:"Зарплата",amount:85000,month:(CM-2+12)%12,year:CY,note:""},
  {id:13,type:"expense",category:"Жильё",amount:30000,month:(CM-2+12)%12,year:CY,note:""},
  {id:14,type:"expense",category:"Здоровье",amount:7000,month:(CM-2+12)%12,year:CY,note:""},
  {id:15,type:"expense",category:"Еда",amount:16000,month:(CM-2+12)%12,year:CY,note:""},
];

const DEMO_GOALS = [
  {id:"g1",name:"Отпуск 🌊",target:120000,saved:42000,color:"#89C4E1",deadline:"2025-08"},
  {id:"g2",name:"Ноут 💻",target:80000,saved:65000,color:"#C3A8D8",deadline:"2025-07"},
  {id:"g3",name:"Подушка 🛡️",target:300000,saved:95000,color:"#A8D8A8",deadline:""},
];

const DEFAULT_SPLIT = [
  {id:1,label:"Жильё",category:"Жильё",pct:30,amount:"",type:"expense",goalId:null},
  {id:2,label:"Еда",category:"Еда",pct:15,amount:"",type:"expense",goalId:null},
  {id:3,label:"Транспорт",category:"Транспорт",pct:5,amount:"",type:"expense",goalId:null},
  {id:4,label:"Подписки",category:"Подписки",pct:3,amount:"",type:"expense",goalId:null},
  {id:5,label:"Развлечения",category:"Развлечения",pct:7,amount:"",type:"expense",goalId:null},
  {id:6,label:"Накопления",category:null,pct:20,amount:"",type:"saving",goalId:"g3"},
  {id:7,label:"Отпуск",category:null,pct:10,amount:"",type:"saving",goalId:"g1"},
  {id:8,label:"Свободные",category:"Другое",pct:10,amount:"",type:"expense",goalId:null},
];

// ── UI primitives ───────────────────────────────────────────────
const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:8,padding:"10px 14px",fontSize:13}}>
    <div style={{color:"#A89F97",marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||P.text}}>{p.name}: {fmt(p.value)}</div>)}
  </div>;
};

const inp  = {background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"8px 11px",fontSize:13,width:"100%",boxSizing:"border-box"};
const card = (extra={}) => ({background:P.surface,borderRadius:12,padding:16,border:`1px solid ${P.border}`,boxShadow:"0 1px 6px rgba(0,0,0,0.04)",...extra});
const lbl  = {fontSize:11,color:P.muted,marginBottom:3,display:"block"};
const btn  = (c,ghost) => ({background:ghost?"transparent":c,color:ghost?c:"#2D2A27",border:`1.5px solid ${c}`,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"});
const bdg  = t => ({display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,
  background:t==="income"?"rgba(249,168,106,0.15)":t==="saving"?"rgba(168,216,168,0.2)":"rgba(242,139,173,0.15)",
  color:t==="income"?P.income:t==="saving"?P.savings:P.expense});
const kpi  = c => ({background:P.surface,borderRadius:10,padding:"14px 16px",borderLeft:`3px solid ${c}`});
const sec  = {fontSize:11,fontWeight:600,color:P.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10};

// ── Receipt scanner API call ────────────────────────────────────
async function parseReceipt(base64, mediaType, expCats) {
  const today = new Date().toISOString().split("T")[0];
  const catList = expCats.join(" | ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-6",
      max_tokens:1000,
      messages:[{
        role:"user",
        content:[
          {type:"image",source:{type:"base64",media_type:mediaType,data:base64}},
          {type:"text",text:`Extract data from this receipt. Today is ${today}.
Use ONLY these categories: ${catList}
Return ONLY valid JSON, no markdown:
{"amount":<number>,"date":"<YYYY-MM-DD>","merchant":"<name or null>","category":"<from list above>","note":"<1-4 words or null>"}`}
        ]
      }]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b=>b.type==="text")?.text??"";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ══════════════════════════════════════════════════════════════════
export default function App() {
  // ── Persisted state ──
  const mk = (key,fb) => [
    useState(()=>load(key,fb)),
    useCallback
  ];

  const [tx,      setTxRaw]    = useState(()=>load("bgt_tx",DEMO_TX));
  const [goals,   setGoalsRaw] = useState(()=>load("bgt_goals",DEMO_GOALS));
  const [split,   setSplitRaw] = useState(()=>load("bgt_split",DEFAULT_SPLIT));
  const [expCats, setExpCatsRaw] = useState(()=>load("bgt_exp_cats",DEFAULT_EXP_CATS));
  const [incCats, setIncCatsRaw] = useState(()=>load("bgt_inc_cats",DEFAULT_INC_CATS));

  const setTx     = v => { const n=typeof v==="function"?v(tx):v;     save("bgt_tx",n);       setTxRaw(n); };
  const setGoals  = v => { const n=typeof v==="function"?v(goals):v;  save("bgt_goals",n);    setGoalsRaw(n); };
  const setSplit  = v => { const n=typeof v==="function"?v(split):v;  save("bgt_split",n);    setSplitRaw(n); };
  const setExpCats= v => { const n=typeof v==="function"?v(expCats):v;save("bgt_exp_cats",n); setExpCatsRaw(n); };
  const setIncCats= v => { const n=typeof v==="function"?v(incCats):v;save("bgt_inc_cats",n); setIncCatsRaw(n); };

  // ── UI state ──
  const [tab,    setTab]    = useState("overview");
  const [fMonth, setFMonth] = useState(CM);
  const [fYear,  setFYear]  = useState(CY);

  // tx form
  const [showTxF, setShowTxF] = useState(false);
  const [txF,     setTxF]     = useState({type:"expense",category:"",amount:"",month:CM,year:CY,note:""});
  const [editTxId,setEditTxId]= useState(null);

  // goal form
  const [showGF,  setShowGF]  = useState(false);
  const [gF,      setGF]      = useState({name:"",target:"",saved:"",color:"#89C4E1",deadline:""});
  const [editGId, setEditGId] = useState(null);
  const [topUpId, setTopUpId] = useState(null);
  const [topUpAmt,setTopUpAmt]= useState("");

  // split
  const [splitSal,     setSplitSal]     = useState("");
  const [splitMode,    setSplitMode]    = useState("pct");
  const [splitPreview, setSplitPreview] = useState(null);
  const [editingTpl,   setEditingTpl]   = useState(false);

  // category settings
  const [newExpCat, setNewExpCat] = useState("");
  const [newIncCat, setNewIncCat] = useState("");

  // receipt scanner
  const [rcStage,   setRcStage]   = useState("idle"); // idle|loading|review|success|error
  const [rcParsed,  setRcParsed]  = useState(null);
  const [rcPreview, setRcPreview] = useState(null);
  const [rcError,   setRcError]   = useState("");
  const [rcForm,    setRcForm]    = useState({});
  const [rcMonth,   setRcMonth]   = useState(CM);
  const [rcYear,    setRcYear]    = useState(CY);
  const fileRef = useRef(null);
  const [dragging, setDragging]   = useState(false);

  // ── Derived ──
  const view   = useMemo(()=>tx.filter(t=>t.month===fMonth&&t.year===fYear),[tx,fMonth,fYear]);
  const totInc = useMemo(()=>view.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),[view]);
  const totExp = useMemo(()=>view.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),[view]);
  const bal    = totInc-totExp;

  const monthly = useMemo(()=>{
    const r=[];
    for(let i=5;i>=0;i--){
      let m=CM-i,y=CY; if(m<0){m+=12;y--;}
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

  const totSaved  = useMemo(()=>goals.reduce((s,g)=>s+g.saved,0),[goals]);
  const totTarget = useMemo(()=>goals.reduce((s,g)=>s+g.target,0),[goals]);
  const splitPctTotal = useMemo(()=>split.reduce((s,r)=>s+Number(r.pct||0),0),[split]);
  const formCats = txF.type==="income" ? incCats : expCats;

  // ── TX helpers ──
  function saveTx(){
    if(!txF.category||!txF.amount||isNaN(+txF.amount)||+txF.amount<=0) return;
    if(editTxId!==null){ setTx(t=>t.map(x=>x.id===editTxId?{...txF,amount:+txF.amount,id:editTxId}:x)); setEditTxId(null); }
    else setTx(t=>[...t,{...txF,amount:+txF.amount,id:uid()}]);
    setTxF({type:"expense",category:"",amount:"",month:CM,year:CY,note:""}); setShowTxF(false);
  }
  function editTxFn(t){ setTxF({...t,amount:String(t.amount)}); setEditTxId(t.id); setShowTxF(true); }
  function delTx(id){ setTx(t=>t.filter(x=>x.id!==id)); }

  // ── Goal helpers ──
  function saveGoal(){
    if(!gF.name||!gF.target||+gF.target<=0) return;
    const obj={...gF,target:+gF.target,saved:+gF.saved||0};
    if(editGId){ setGoals(g=>g.map(x=>x.id===editGId?{...obj,id:editGId}:x)); setEditGId(null); }
    else setGoals(g=>[...g,{...obj,id:"g"+uid()}]);
    setGF({name:"",target:"",saved:"",color:"#89C4E1",deadline:""}); setShowGF(false);
  }
  function editGoalFn(g){ setGF({...g,target:String(g.target),saved:String(g.saved)}); setEditGId(g.id); setShowGF(true); }
  function delGoal(id){ setGoals(g=>g.filter(x=>x.id!==id)); }
  function confirmTopUp(){ const a=+topUpAmt; if(!a||a<=0) return; setGoals(g=>g.map(x=>x.id===topUpId?{...x,saved:x.saved+a}:x)); setTopUpId(null); setTopUpAmt(""); }

  // ── Split helpers ──
  function calcSplit(){
    const sal=+splitSal; if(!sal||sal<=0) return;
    setSplitPreview(split.map(r=>({...r,amount:splitMode==="amount"?+r.amount||0:Math.round(sal*(Number(r.pct)||0)/100)})));
  }
  function applySplit(){
    if(!splitPreview) return;
    const sal=+splitSal;
    setTx(t=>[...t,{id:uid(),type:"income",category:"Зарплата",amount:sal,month:fMonth,year:fYear,note:"Зарплата (распределение)"}]);
    splitPreview.forEach(r=>{
      if(r.type==="expense"&&r.amount>0) setTx(t=>[...t,{id:uid(),type:"expense",category:r.category,amount:r.amount,month:fMonth,year:fYear,note:r.label}]);
      else if(r.type==="saving"&&r.goalId&&r.amount>0) setGoals(g=>g.map(x=>x.id===r.goalId?{...x,saved:x.saved+r.amount}:x));
    });
    setSplitPreview(null); setSplitSal("");
  }
  function updateRow(id,field,val){ setSplit(rows=>rows.map(r=>r.id===id?{...r,[field]:val}:r)); }
  function addSplitRow(){ setSplit(rows=>[...rows,{id:uid(),label:"Новая",category:"Другое",pct:0,amount:"",type:"expense",goalId:null}]); }
  function delSplitRow(id){ setSplit(rows=>rows.filter(r=>r.id!==id)); }

  // ── Receipt helpers ──
  async function handleReceiptFile(file){
    setRcStage("loading"); setRcError("");
    setRcPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    try {
      const base64 = await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=()=>rej(new Error("Ошибка чтения"));
        r.readAsDataURL(file);
      });
      const result = await parseReceipt(base64, file.type, expCats);
      const dateObj = result.date ? new Date(result.date) : new Date();
      setRcParsed(result);
      setRcForm({
        amount: result.amount ?? "",
        date: result.date ?? new Date().toISOString().split("T")[0],
        merchant: result.merchant ?? "",
        category: expCats.includes(result.category) ? result.category : expCats[0],
        note: result.note ?? "",
      });
      setRcMonth(dateObj.getMonth());
      setRcYear(dateObj.getFullYear());
      setRcStage("review");
    } catch(e) {
      setRcError("Не удалось распознать чек. Попробуй другое фото или проверь соединение.");
      setRcStage("error");
    }
  }
  function confirmReceipt(){
    const a = +rcForm.amount;
    if(!a||a<=0) return;
    let category = rcForm.category;
    if(category==="__new__"){
      const name = (rcForm.newCategoryName||"").trim();
      if(!name) return;
      category = name;
      if(!expCats.includes(name)) setExpCats(l=>[...l,name]);
    }
    setTx(t=>[...t,{
      id:uid(), type:"expense",
      category,
      amount: a,
      month: rcMonth,
      year: rcYear,
      note: [rcForm.merchant, rcForm.note].filter(Boolean).join(" · ") || "",
    }]);
    setRcStage("success");
    setTimeout(()=>{ setRcStage("idle"); setRcParsed(null); setRcPreview(null); setRcForm({}); }, 2000);
  }
  function resetReceipt(){ setRcStage("idle"); setRcParsed(null); setRcPreview(null); setRcForm({}); setRcError(""); }

  // ── Render ──────────────────────────────────────────────────────
  const TABS = [["overview","Обзор"],["table","Транзакции"],["receipt","🧾 Чеки"],["savings","Накопления"],["split","Зарплата"],["charts","Графики"],["settings","⚙ Категории"]];

  return (
    <div style={{background:P.bg,minHeight:"100vh",color:P.text,fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:48}}>

      {/* Header */}
      <div style={{padding:"22px 20px 0",borderBottom:`1px solid ${P.border}`,background:P.bg}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.5px",marginBottom:2}}>Бюджет</div>
        <div style={{fontSize:12,color:P.muted,marginBottom:14}}>Данные сохраняются в браузере автоматически</div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 13px",borderRadius:"7px 7px 0 0",fontSize:12,fontWeight:500,background:tab===k?"#FFF0EA":"transparent",color:tab===k?P.text:P.muted,border:"none",cursor:"pointer",borderTop:tab===k?`2px solid ${P.income}`:"2px solid transparent",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 20px 0"}}>

        {/* Month bar */}
        {!["savings","split","receipt","settings"].includes(tab)&&(
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:18,flexWrap:"wrap"}}>
            <select style={{background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fMonth} onChange={e=>setFMonth(+e.target.value)}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <select style={{background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fYear} onChange={e=>setFYear(+e.target.value)}>
              {[CY-1,CY,CY+1].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            {["overview","table"].includes(tab)&&<button style={btn(P.income)} onClick={()=>{setShowTxF(true);setEditTxId(null);setTxF({type:"expense",category:"",amount:"",month:fMonth,year:fYear,note:""});}}>+ Добавить</button>}
          </div>
        )}

        {/* Tx form */}
        {showTxF&&(
          <div style={{...card(),marginBottom:18,border:`1px solid ${P.income}55`}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{editTxId?"Редактировать":"Новая запись"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Тип</label>
                <select style={inp} value={txF.type} onChange={e=>setTxF(f=>({...f,type:e.target.value,category:""}))}>
                  <option value="income">Доход</option><option value="expense">Расход</option></select></div>
              <div><label style={lbl}>Категория</label>
                <select style={inp} value={txF.category} onChange={e=>setTxF(f=>({...f,category:e.target.value}))}>
                  <option value="">— выбрать —</option>{formCats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Сумма, ₽</label>
                <input style={inp} type="number" placeholder="0" value={txF.amount} onChange={e=>setTxF(f=>({...f,amount:e.target.value}))} /></div>
              <div><label style={lbl}>Заметка</label>
                <input style={inp} type="text" placeholder="необязательно" value={txF.note} onChange={e=>setTxF(f=>({...f,note:e.target.value}))} /></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={btn(P.income)} onClick={saveTx}>{editTxId?"Сохранить":"Добавить"}</button>
              <button style={btn(P.muted,true)} onClick={()=>{setShowTxF(false);setEditTxId(null);}}>Отмена</button>
            </div>
          </div>
        )}

        {/* KPI */}
        {["overview","table"].includes(tab)&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            <div style={kpi(P.income)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Доходы</div><div style={{fontSize:18,fontWeight:700,color:P.income}}>{fmt(totInc)}</div></div>
            <div style={kpi(P.expense)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Расходы</div><div style={{fontSize:18,fontWeight:700,color:P.expense}}>{fmt(totExp)}</div></div>
            <div style={kpi(bal>=0?P.balance:P.expense)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Остаток</div><div style={{fontSize:18,fontWeight:700,color:bal>=0?P.balance:P.expense}}>{fmt(bal)}</div></div>
          </div>
        )}

        {/* ─ OVERVIEW ─ */}
        {tab==="overview"&&(<>
          <div style={{marginBottom:20}}>
            <div style={sec}>Расходы по категориям</div>
            <div style={card()}>
              {catData.length===0?<div style={{color:P.muted,fontSize:13}}>Нет расходов за этот месяц</div>
                :catData.map((c,i)=>(
                  <div key={c.name} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                      <span style={{color:P.cats[i%P.cats.length]}}>{c.name}</span>
                      <span>{fmt(c.value)} <span style={{color:P.muted,fontSize:11}}>({totExp>0?Math.round(c.value/totExp*100):0}%)</span></span>
                    </div>
                    <div style={{height:5,background:"#EDE8E3",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${totExp>0?c.value/totExp*100:0}%`,background:P.cats[i%P.cats.length],borderRadius:4}} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={sec}>Накопления</div>
            <div style={card()}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                <span style={{color:P.savings,fontWeight:600}}>{fmt(totSaved)}</span>
                <span style={{color:P.muted}}>из {fmt(totTarget)}</span>
              </div>
              <div style={{height:6,background:"#EDE8E3",borderRadius:4,overflow:"hidden",marginBottom:14}}>
                <div style={{height:"100%",width:`${totTarget>0?Math.min(totSaved/totTarget*100,100):0}%`,background:P.savings,borderRadius:4}} />
              </div>
              {goals.map(g=>{const pct=g.target>0?Math.min(g.saved/g.target*100,100):0; return(
                <div key={g.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                    <span style={{color:g.color}}>{g.name}</span>
                    <span style={{color:P.muted}}>{fmt(g.saved)} / {fmt(g.target)}{g.deadline?` · ${g.deadline}`:""}</span>
                  </div>
                  <div style={{height:4,background:"#EDE8E3",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:g.color,borderRadius:3}} />
                  </div>
                </div>
              );})}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={sec}>Последние операции</div>
            <div style={card()}>
              {view.length===0?<div style={{color:P.muted,fontSize:13}}>Нет записей</div>
                :[...view].reverse().slice(0,5).map((t,i,arr)=>(
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                    <div><span style={bdg(t.type)}>{t.category}</span>{t.note&&<span style={{color:P.muted,fontSize:12,marginLeft:8}}>{t.note}</span>}</div>
                    <span style={{fontWeight:600,color:t.type==="income"?P.income:P.expense}}>{t.type==="income"?"+":"−"}{fmt(t.amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        </>)}

        {/* ─ TABLE ─ */}
        {tab==="table"&&(
          <div style={{...card(),overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>{["Тип","Категория","Сумма","Заметка",""].map(h=><th key={h} style={{textAlign:"left",padding:"7px 9px",color:P.muted,fontWeight:500,borderBottom:`1px solid ${P.border}`,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>
                {view.length===0?<tr><td colSpan={5} style={{padding:20,color:P.muted,textAlign:"center"}}>Нет записей. Нажмите «+ Добавить».</td></tr>
                  :[...view].reverse().map((t,i,arr)=>(
                    <tr key={t.id}>
                      <td style={{padding:"9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}><span style={bdg(t.type)}>{t.type==="income"?"Доход":"Расход"}</span></td>
                      <td style={{padding:"9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>{t.category}</td>
                      <td style={{padding:"9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",fontWeight:600,color:t.type==="income"?P.income:P.expense}}>{t.type==="income"?"+":"−"}{fmt(t.amount)}</td>
                      <td style={{padding:"9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",color:P.muted}}>{t.note||"—"}</td>
                      <td style={{padding:"9px",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                        <span style={{cursor:"pointer",marginRight:8}} onClick={()=>editTxFn(t)}>✏️</span>
                        <span style={{cursor:"pointer",color:P.expense}} onClick={()=>delTx(t.id)}>✕</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─ RECEIPT SCANNER ─ */}
        {tab==="receipt"&&(
          <div style={{maxWidth:500}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:3,marginTop:4}}>Сканер чеков</div>
            <div style={{fontSize:13,color:P.muted,marginBottom:18}}>Загрузи фото чека — Claude распознает сумму и категорию автоматически</div>

            {/* Drop zone */}
            {(rcStage==="idle"||rcStage==="error")&&(
              <>
                <div
                  onClick={()=>fileRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();setDragging(true);}}
                  onDragLeave={()=>setDragging(false)}
                  onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handleReceiptFile(f);}}
                  style={{border:`2px dashed ${dragging?P.income:P.border}`,borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",background:dragging?"#FFF0EA":"#FAF6F2",transition:"all 0.15s",marginBottom:rcError?12:0}}
                >
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>e.target.files[0]&&handleReceiptFile(e.target.files[0])} />
                  <div style={{fontSize:32,marginBottom:8}}>🧾</div>
                  <div style={{fontWeight:600,marginBottom:4}}>Загрузить чек</div>
                  <div style={{fontSize:12,color:P.muted}}>Фото или PDF — перетащи или нажми</div>
                </div>
                {rcError&&<div style={{background:"#FFF0F3",border:`1px solid ${P.expense}44`,borderRadius:10,padding:"12px 14px",color:P.expense,fontSize:13,marginTop:10}}>{rcError}</div>}
              </>
            )}

            {/* Loading */}
            {rcStage==="loading"&&(
              <div style={{...card(),textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                <div style={{fontWeight:600,marginBottom:4}}>Читаю чек…</div>
                <div style={{fontSize:12,color:P.muted}}>Это займёт пару секунд</div>
              </div>
            )}

            {/* Review */}
            {rcStage==="review"&&rcForm&&(
              <div style={card()}>
                {rcPreview&&(
                  <div style={{marginBottom:16,borderRadius:10,overflow:"hidden",maxHeight:160,display:"flex",alignItems:"center",justifyContent:"center",background:"#FAF6F2"}}>
                    <img src={rcPreview} alt="чек" style={{maxHeight:160,maxWidth:"100%",objectFit:"contain"}} />
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                  <div><label style={lbl}>Сумма, ₽</label>
                    <input style={inp} type="number" value={rcForm.amount} onChange={e=>setRcForm(f=>({...f,amount:e.target.value}))} /></div>
                  <div><label style={lbl}>Дата</label>
                    <input style={inp} type="date" value={rcForm.date} onChange={e=>setRcForm(f=>({...f,date:e.target.value}))} /></div>
                  <div><label style={lbl}>Месяц в трекере</label>
                    <select style={inp} value={rcMonth} onChange={e=>setRcMonth(+e.target.value)}>
                      {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select></div>
                  <div><label style={lbl}>Год</label>
                    <select style={inp} value={rcYear} onChange={e=>setRcYear(+e.target.value)}>
                      {[CY-1,CY,CY+1].map(y=><option key={y} value={y}>{y}</option>)}
                    </select></div>
                  <div style={{gridColumn:"1/-1"}}><label style={lbl}>Категория</label>
                    {rcForm.category==="__new__"
                      ? <div style={{display:"flex",gap:6}}>
                          <input style={{...inp,flex:1}} autoFocus placeholder="Название новой категории"
                            value={rcForm.newCategoryName||""}
                            onChange={e=>setRcForm(f=>({...f,newCategoryName:e.target.value}))} />
                          <button style={{...btn(P.muted,true),padding:"7px 10px",fontSize:12}}
                            onClick={()=>setRcForm(f=>({...f,category:expCats[0],newCategoryName:""}))}>Отмена</button>
                        </div>
                      : <select style={inp} value={rcForm.category} onChange={e=>setRcForm(f=>({...f,category:e.target.value}))}>
                          {expCats.map(c=><option key={c} value={c}>{c}</option>)}
                          <option value="__new__">+ Новая категория…</option>
                        </select>
                    }
                  </div>
                  <div><label style={lbl}>Магазин</label>
                    <input style={inp} placeholder="необязательно" value={rcForm.merchant} onChange={e=>setRcForm(f=>({...f,merchant:e.target.value}))} /></div>
                  <div><label style={lbl}>Заметка</label>
                    <input style={inp} placeholder="необязательно" value={rcForm.note} onChange={e=>setRcForm(f=>({...f,note:e.target.value}))} /></div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button style={btn(P.income)} onClick={confirmReceipt}>Добавить транзакцию</button>
                  <button style={btn(P.muted,true)} onClick={resetReceipt}>Отмена</button>
                </div>
              </div>
            )}

            {/* Success */}
            {rcStage==="success"&&(
              <div style={{...card(),textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:36,marginBottom:10}}>✅</div>
                <div style={{fontWeight:600}}>Транзакция добавлена</div>
              </div>
            )}
          </div>
        )}

        {/* ─ SAVINGS ─ */}
        {tab==="savings"&&(<>
          <div style={{display:"flex",alignItems:"center",marginBottom:16,marginTop:4}}>
            <div style={{fontSize:16,fontWeight:700}}>Цели накоплений</div>
            <button style={{...btn(P.savings),marginLeft:"auto"}} onClick={()=>{setShowGF(true);setEditGId(null);setGF({name:"",target:"",saved:"",color:"#89C4E1",deadline:""});}}>+ Новая цель</button>
          </div>
          {showGF&&(
            <div style={{...card(),marginBottom:18,border:`1px solid ${P.savings}55`}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{editGId?"Редактировать цель":"Новая цель"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{gridColumn:"1/-1"}}><label style={lbl}>Название</label><input style={inp} placeholder="Например: Отпуск 🌊" value={gF.name} onChange={e=>setGF(f=>({...f,name:e.target.value}))} /></div>
                <div><label style={lbl}>Цель, ₽</label><input style={inp} type="number" value={gF.target} onChange={e=>setGF(f=>({...f,target:e.target.value}))} /></div>
                <div><label style={lbl}>Уже накоплено, ₽</label><input style={inp} type="number" placeholder="0" value={gF.saved} onChange={e=>setGF(f=>({...f,saved:e.target.value}))} /></div>
                <div><label style={lbl}>Срок (ГГГГ-ММ)</label><input style={inp} placeholder="2025-12" value={gF.deadline} onChange={e=>setGF(f=>({...f,deadline:e.target.value}))} /></div>
                <div><label style={lbl}>Цвет</label>
                  <div style={{display:"flex",gap:6,paddingTop:4}}>
                    {["#89C4E1","#A8D8A8","#C3A8D8","#F9A86A","#F28BAD","#F9D06A"].map(c=>(
                      <div key={c} onClick={()=>setGF(f=>({...f,color:c}))} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:gF.color===c?"2.5px solid #2D2A27":"2.5px solid transparent"}} />
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
            <div style={{...card(),marginBottom:18,border:`1px solid ${P.savings}55`}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Пополнить: {goals.find(g=>g.id===topUpId)?.name}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input style={{...inp,width:150}} type="number" placeholder="Сумма ₽" value={topUpAmt} onChange={e=>setTopUpAmt(e.target.value)} />
                <button style={btn(P.savings)} onClick={confirmTopUp}>Добавить</button>
                <button style={btn(P.muted,true)} onClick={()=>{setTopUpId(null);setTopUpAmt("");}}>Отмена</button>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            <div style={kpi(P.savings)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Накоплено</div><div style={{fontSize:18,fontWeight:700,color:P.savings}}>{fmt(totSaved)}</div></div>
            <div style={kpi(P.balance)}><div style={{fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Осталось</div><div style={{fontSize:18,fontWeight:700,color:P.balance}}>{fmt(Math.max(0,totTarget-totSaved))}</div></div>
          </div>
          {goals.length===0?<div style={{...card(),color:P.muted,fontSize:13}}>Нет целей. Нажмите «+ Новая цель».</div>
            :goals.map(g=>{const pct=g.target>0?Math.min(g.saved/g.target*100,100):0;const done=pct>=100;return(
              <div key={g.id} style={{...card({marginBottom:12}),borderLeft:`3px solid ${g.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{g.name}{done?" ✅":""}</div>
                    {g.deadline&&<div style={{fontSize:11,color:P.muted}}>Срок: {g.deadline}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button style={{...btn(g.color),padding:"5px 10px",fontSize:12}} onClick={()=>{setTopUpId(g.id);setTopUpAmt("");}}>+ Пополнить</button>
                    <span style={{cursor:"pointer",fontSize:13,color:P.muted}} onClick={()=>editGoalFn(g)}>✏️</span>
                    <span style={{cursor:"pointer",fontSize:13,color:P.expense}} onClick={()=>delGoal(g.id)}>✕</span>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                  <span style={{color:g.color,fontWeight:600}}>{fmt(g.saved)}</span>
                  <span style={{color:P.muted}}>из {fmt(g.target)} · <span style={{color:done?P.savings:P.text}}>{Math.round(pct)}%</span></span>
                </div>
                <div style={{height:8,background:"#EDE8E3",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:g.color,borderRadius:4,transition:"width 0.4s"}} />
                </div>
                {!done&&<div style={{fontSize:11,color:P.muted,marginTop:4}}>Ещё {fmt(g.target-g.saved)}</div>}
              </div>
            );})}
        </>)}

        {/* ─ SPLIT ─ */}
        {tab==="split"&&(<>
          <div style={{marginBottom:18,marginTop:4}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>Распределение зарплаты</div>
            <div style={{fontSize:13,color:P.muted}}>Введи сумму, настрой шаблон, применить одним нажатием.</div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={sec}>Шаблон</div>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                {editingTpl&&<button style={{...btn(P.income),padding:"4px 10px",fontSize:11}} onClick={addSplitRow}>+ Строка</button>}
                <button style={{...btn(editingTpl?P.savings:P.muted,!editingTpl),padding:"4px 10px",fontSize:11}} onClick={()=>setEditingTpl(e=>!e)}>
                  {editingTpl?"Готово":"Изменить"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[["pct","По %"],["amount","По суммам"]].map(([m,l])=>(
                <button key={m} onClick={()=>setSplitMode(m)} style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:`1.5px solid ${splitMode===m?P.income:P.border}`,background:splitMode===m?"rgba(249,168,106,0.13)":"transparent",color:splitMode===m?P.income:P.muted}}>{l}</button>
              ))}
            </div>
            <div style={card()}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 90px auto",gap:8,padding:"0 0 8px",borderBottom:`1px solid ${P.border}`,fontSize:11,color:P.muted,marginBottom:8}}>
                <span>Название</span><span style={{textAlign:"right"}}>{splitMode==="pct"?"%":"₽"}</span><span>Тип</span><span>→ Цель</span>{editingTpl&&<span/>}
              </div>
              {split.map((row,i,arr)=>(
                <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 90px auto",gap:8,alignItems:"center",padding:"6px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none"}}>
                  {editingTpl
                    ?<div style={{display:"flex",gap:4}}>
                        <input style={{...inp,padding:"5px 8px"}} value={row.label} onChange={e=>updateRow(row.id,"label",e.target.value)} />
                        <select style={{...inp,padding:"5px 6px",width:110,flexShrink:0}} value={row.category||""} onChange={e=>updateRow(row.id,"category",e.target.value||null)}>
                          <option value="">— нет —</option>{expCats.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    :<span style={{fontSize:13}}>{row.label}<span style={{color:P.muted,fontSize:11,marginLeft:5}}>{row.category||""}</span></span>
                  }
                  {editingTpl
                    ?<input style={{...inp,padding:"5px 8px",textAlign:"right"}} type="number" value={splitMode==="pct"?row.pct:row.amount} onChange={e=>updateRow(row.id,splitMode==="pct"?"pct":"amount",e.target.value)} />
                    :<span style={{textAlign:"right",fontSize:13,fontWeight:500}}>{splitMode==="pct"?`${row.pct}%`:fmt(+row.amount||0)}</span>
                  }
                  {editingTpl
                    ?<select style={{...inp,padding:"5px 6px",fontSize:12}} value={row.type} onChange={e=>updateRow(row.id,"type",e.target.value)}>
                        <option value="expense">расход</option><option value="saving">накопл.</option>
                      </select>
                    :<span style={bdg(row.type)}>{row.type==="saving"?"накопл.":"расход"}</span>
                  }
                  {editingTpl
                    ?<select style={{...inp,padding:"5px 6px",fontSize:12}} value={row.goalId||""} onChange={e=>updateRow(row.id,"goalId",e.target.value||null)}>
                        <option value="">— нет —</option>{goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    :<span style={{fontSize:11,color:row.type==="saving"?P.savings:P.muted}}>{row.type==="saving"?(goals.find(g=>g.id===row.goalId)?.name||"не выбрано"):""}</span>
                  }
                  {editingTpl&&<span style={{cursor:"pointer",color:P.expense,fontSize:13}} onClick={()=>delSplitRow(row.id)}>✕</span>}
                </div>
              ))}
              {splitMode==="pct"&&<div style={{display:"flex",justifyContent:"flex-end",paddingTop:10,fontSize:12}}>
                <span style={{color:splitPctTotal===100?P.savings:P.expense,fontWeight:600}}>Итого: {splitPctTotal}%{splitPctTotal!==100?" (нужно 100%)":""}</span>
              </div>}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={sec}>Применить к месяцу</div>
            <div style={card()}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:splitPreview?16:0}}>
                <select style={{background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fMonth} onChange={e=>setFMonth(+e.target.value)}>
                  {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
                <select style={{background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"7px 10px",fontSize:13}} value={fYear} onChange={e=>setFYear(+e.target.value)}>
                  {[CY-1,CY,CY+1].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <input style={{...inp,width:160}} type="number" placeholder="Сумма зарплаты ₽" value={splitSal} onChange={e=>setSplitSal(e.target.value)} />
                <button style={{...btn(P.income),opacity:(splitMode==="pct"&&splitPctTotal!==100)?0.5:1}} onClick={calcSplit} disabled={splitMode==="pct"&&splitPctTotal!==100}>Рассчитать</button>
              </div>
              {splitPreview&&(<>
                <div style={{fontSize:12,color:P.muted,marginBottom:10}}>Предпросмотр:</div>
                {splitPreview.map((row,i,arr)=>(
                  <div key={row.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none",fontSize:13}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={bdg(row.type)}>{row.type==="saving"?"накопление":"расход"}</span>
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
              </>)}
            </div>
          </div>
        </>)}

        {/* ─ CHARTS ─ */}
        {tab==="charts"&&(<>
          <div style={{marginBottom:20}}>
            <div style={sec}>Доходы и расходы за 6 месяцев</div>
            <div style={card()}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthly} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
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
          <div style={{marginBottom:20}}>
            <div style={sec}>Остаток по месяцам</div>
            <div style={card()}>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
                  <XAxis dataKey="name" tick={{fill:P.muted,fontSize:12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:P.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}к`:v} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="balance" name="Остаток" stroke={P.balance} strokeWidth={2.5} dot={{fill:P.balance,r:4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={sec}>Расходы по категориям — {MONTHS[fMonth]}</div>
            <div style={card()}>
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
        </>)}

        {/* ─ SETTINGS ─ */}
        {tab==="settings"&&(<>
          <div style={{marginBottom:18,marginTop:4}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>Категории</div>
            <div style={{fontSize:13,color:P.muted}}>Один список для всего трекера — транзакций, чеков и шаблона зп.</div>
          </div>

          {[["Категории расходов", expCats, setExpCats, newExpCat, setNewExpCat, P.expense, DEFAULT_EXP_CATS],
            ["Категории доходов",  incCats, setIncCats, newIncCat, setNewIncCat, P.income,  DEFAULT_INC_CATS]
          ].map(([title, list, setList, newVal, setNewVal, color, defaults])=>(
            <div key={title} style={{marginBottom:22}}>
              <div style={sec}>{title}</div>
              <div style={card()}>
                {list.map((cat,i)=>(
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<list.length-1?`1px solid ${P.border}`:"none"}}>
                    <span style={{flex:1,fontSize:13}}>{cat}</span>
                    {list.length>1&&(
                      <button onClick={()=>setList(l=>l.filter(c=>c!==cat))}
                        style={{background:"none",border:"none",color:P.expense,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1}}>✕</button>
                    )}
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <input style={{...inp,flex:1}} placeholder="Новая категория..." value={newVal}
                    onChange={e=>setNewVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&newVal.trim()&&!list.includes(newVal.trim())){setList(l=>[...l,newVal.trim()]);setNewVal("");}}} />
                  <button style={btn(color)} onClick={()=>{if(newVal.trim()&&!list.includes(newVal.trim())){setList(l=>[...l,newVal.trim()]);setNewVal("");}}}>
                    Добавить
                  </button>
                </div>
                <div style={{marginTop:10}}>
                  <button style={{...btn(P.muted,true),padding:"5px 10px",fontSize:11}} onClick={()=>setList(defaults)}>
                    Сбросить к стандартным
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>)}

      </div>
    </div>
  );
}
