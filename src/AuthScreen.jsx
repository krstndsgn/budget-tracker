import { useState } from "react";
import { supabase } from "./supabaseClient";

const P = {
  income:"#F9A86A", expense:"#F28BAD", balance:"#89C4E1", savings:"#A8D8A8",
  bg:"#FDF8F5", surface:"#FFFFFF", border:"#EDE8E3", text:"#2D2A27", muted:"#A89F97",
};

const inp = {background:"#FAF6F2",border:`1px solid ${P.border}`,color:P.text,borderRadius:8,padding:"11px 13px",fontSize:14,width:"100%",boxSizing:"border-box"};
const btn = (c) => ({background:c,color:"#2D2A27",border:`1.5px solid ${c}`,borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer",width:"100%"});

export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Проверь почту — пришло письмо для подтверждения регистрации.");
      }
    } catch (err) {
      const msg = err?.message || "Что-то пошло не так";
      if (msg.includes("Invalid login credentials")) setError("Неверный email или пароль");
      else if (msg.includes("already registered")) setError("Этот email уже зарегистрирован — попробуй войти");
      else if (msg.includes("Password should be")) setError("Пароль должен быть не короче 6 символов");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{background:P.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:20}}>
      <div style={{background:P.surface,borderRadius:16,padding:32,width:"100%",maxWidth:380,border:`1px solid ${P.border}`,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4,color:P.text}}>Бюджет</div>
        <div style={{fontSize:13,color:P.muted,marginBottom:24}}>
          {mode==="signin" ? "Войди чтобы продолжить" : "Создай аккаунт"}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:P.muted,marginBottom:4,display:"block"}}>Email</label>
            <input style={inp} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div style={{marginBottom:18}}>
            <label style={{fontSize:11,color:P.muted,marginBottom:4,display:"block"}}>Пароль</label>
            <input style={inp} type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="не менее 6 символов" />
          </div>

          {error && <div style={{background:"#FFF0F3",border:`1px solid ${P.expense}44`,borderRadius:8,padding:"10px 12px",color:P.expense,fontSize:13,marginBottom:14}}>{error}</div>}
          {info && <div style={{background:"#F0FBF0",border:`1px solid ${P.savings}55`,borderRadius:8,padding:"10px 12px",color:"#3D8C4A",fontSize:13,marginBottom:14}}>{info}</div>}

          <button type="submit" disabled={loading} style={{...btn(P.income),opacity:loading?0.6:1}}>
            {loading ? "Подождите…" : mode==="signin" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:18,fontSize:13,color:P.muted}}>
          {mode==="signin" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <span
            onClick={()=>{setMode(m=>m==="signin"?"signup":"signin");setError("");setInfo("");}}
            style={{color:P.income,cursor:"pointer",fontWeight:600}}
          >
            {mode==="signin" ? "Создать" : "Войти"}
          </span>
        </div>
      </div>
    </div>
  );
}
