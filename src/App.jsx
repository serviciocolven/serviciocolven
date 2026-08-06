import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Tv, Users, UserCheck, Wallet, Plus, Trash2, Pencil,
  AlertTriangle, Copy, Eye, EyeOff, X, Check, RefreshCw, LogOut, Search, Send,
  Lock, Shield, LogIn, UserCog, History, Menu, PieChart, KeyRound, Sun, Moon, Download, DollarSign
} from "lucide-react";
import { storage } from "./storage.js";
import { generateClosurePdf } from "./pdf.js";
const DARK_THEME = {
  bg: "#0B0F14",
  panel: "#12191F",
  panel2: "#1A232B",
  border: "#243039",
  text: "#E8EDF2",
  muted: "#9BA9B8",
  accent: "#6C5CE7",
  accent2: "#2DD4BF",
  warn: "#F5A623",
  danger: "#EF4444",
  success: "#2DD4BF",
};

const LIGHT_THEME = {
  bg: "#F5F6F8",
  panel: "#FFFFFF",
  panel2: "#F0F2F5",
  border: "#E1E4E9",
  text: "#181C22",
  muted: "#5B6472",
  accent: "#6C5CE7",
  accent2: "#0D9488",
  warn: "#B45309",
  danger: "#DC2626",
  success: "#0D9488",
};

// C es el tema activo. Se reasigna en tiempo de render según la preferencia guardada.
let C = DARK_THEME;

const PLATFORM_PRESETS = [
  "Netflix", "Disney+", "HBO Max", "Amazon Prime Video", "Star+",
  "Paramount+", "Crunchyroll", "Vix Premium", "Apple TV+", "YouTube Premium",
  "Spotify", "Telelatino", "Otro",
];

const RESELLER_PALETTE = [
  "#F94144", "#F3722C", "#F8961E", "#F9C74F", "#90BE6D",
  "#43AA8B", "#4D908E", "#577590", "#277DA1", "#B983FF",
  "#FF6FB5", "#94A3B8",
];

const PLATFORM_PALETTE = [
  "#93C5FD", "#3B82F6", "#1E40AF", // azul claro, azul, azul oscuro
  "#5EEAD4", "#14B8A6", "#0F766E", // turquesa
  "#86EFAC", "#22C55E", "#15803D", // verde
  "#FDE68A", "#F59E0B", "#B45309", // amarillo / ámbar
  "#FDBA74", "#F97316", "#C2410C", // naranja
  "#FCA5A5", "#EF4444", "#B91C1C", // rojo
  "#F9A8D4", "#EC4899", "#A21CAF", // rosa / magenta
  "#D8B4FE", "#A855F7", "#6D28D9", // morado
  "#CBD5E1", "#64748B", "#334155", // gris
];

function contrastText(hex) {
  if (!hex) return "#0B0F14";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0B0F14" : "#FFFFFF";
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random());
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, days) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const daysUntil = (dateStr) => {
  const today = new Date(todayISO() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
};
const fmtMoney = (n) =>
  (Number(n) || 0).toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

function statusFor(cutDate, cancelled) {
  if (cancelled) return { key: "cancelled", label: "Retirado", color: C.muted };
  const days = daysUntil(cutDate);
  if (days < 0) return { key: "expired", label: `Vencido (${Math.abs(days)}d)`, color: C.danger, days };
  if (days <= 3) return { key: "soon", label: days === 0 ? "Vence hoy" : `Vence en ${days}d`, color: C.warn, days };
  return { key: "active", label: `Activo · ${days}d`, color: C.accent2, days };
}

function Ring({ days, cycle = 30, color }) {
  const pct = Math.max(0, Math.min(1, days / cycle));
  const r = 16, c = 2 * Math.PI * r;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke={C.border} strokeWidth="4" />
      <circle
        cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fill={C.text} fontFamily="JetBrains Mono, monospace">
        {days < 0 ? "!" : days}
      </text>
    </svg>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,8,11,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 24, width: "100%", maxWidth: wide ? 640 : 460, maxHeight: "88vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 17, fontWeight: 700, margin: 0, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function themedStyle(builder) {
  const obj = {};
  Object.keys(builder(DARK_THEME)).forEach((key) => {
    Object.defineProperty(obj, key, { enumerable: true, get: () => builder(C)[key] });
  });
  return obj;
}

const inputStyle = themedStyle((c) => ({
  width: "100%", background: c.panel2, border: `1px solid ${c.border}`, borderRadius: 8,
  padding: "9px 11px", color: c.text, fontSize: 14.5, fontFamily: "Inter, sans-serif", outline: "none", marginTop: 4,
}));
const labelStyle = themedStyle((c) => ({ fontSize: 13, color: c.muted, fontWeight: 500 }));
const fieldWrap = { marginBottom: 14 };
const btnPrimary = themedStyle((c) => ({
  background: c.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px",
  fontSize: 14.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif",
}));
const btnGhost = themedStyle((c) => ({
  background: "transparent", color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 16px",
  fontSize: 14.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif",
}));
const iconBtnStyle = themedStyle((c) => ({
  background: "transparent", border: "none", color: c.muted, cursor: "pointer", padding: 6, borderRadius: 6,
  display: "flex", alignItems: "center", justifyContent: "center",
}));

function Field({ label, children }) {
  return <div style={fieldWrap}><div style={labelStyle}>{label}</div>{children}</div>;
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: color || C.text, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      style={iconBtnStyle}
      onClick={() => {
        navigator.clipboard?.writeText(value || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copiar"
    >
      {copied ? <Check size={13} color={C.accent2} /> : <Copy size={13} />}
    </button>
  );
}

function SecretText({ value }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 13.5 }}>
      {show ? value : "••••••••"}
      <button style={iconBtnStyle} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <CopyBtn value={value} />
    </span>
  );
}

// ==================== Tasa del dólar (Bs.) ====================
// Usa DolarAPI (ve.dolarapi.com), una API pública y gratuita sin necesidad de clave,
// para que el dueño y los revendedores vean la tasa paralela actualizada.
function useDollarRates() {
  const [rates, setRates] = useState(null); // { paralelo }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/paralelo");
      if (!res.ok) throw new Error("bad response");
      const paralelo = await res.json();
      setRates({ paralelo });
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 10 * 60 * 1000); // se refresca sola cada 10 min
    return () => clearInterval(interval);
  }, []);

  return { rates, loading, error, refresh: fetchRates };
}

function DollarRateBanner({ dollar, compact }) {
  const { rates, loading, error, refresh } = dollar;
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: compact ? "10px 16px" : "14px 18px", display: "flex", alignItems: "center",
      gap: compact ? 16 : 24, flexWrap: "wrap", marginBottom: compact ? 14 : 22,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <DollarSign size={16} color={C.accent} />
        <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 13.5 }}>Precio dólar</span>
      </div>
      {loading && !rates && <span style={{ color: C.muted, fontSize: 13.5 }}>Consultando...</span>}
      {error && !rates && (
        <span style={{ color: C.danger, fontSize: 13.5 }}>No se pudo obtener la tasa ahora.</span>
      )}
      {rates?.paralelo && (
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: compact ? 18 : 22, color: C.accent2 }}>
          Bs. {Number(rates.paralelo.promedio).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {rates?.paralelo?.fechaActualizacion && (
        <div style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>
          Actualizado {new Date(rates.paralelo.fechaActualizacion).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
      <button style={iconBtnStyle} onClick={refresh} title="Actualizar ahora">
        <RefreshCw size={14} />
      </button>
    </div>
  );
}

export default function App() {
  const dollar = useDollarRates();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminModal, setAdminModal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [groupColors, setGroupColors] = useState({});
  const [ledger, setLedger] = useState([]);
  const [closures, setClosures] = useState([]);
  const [cashBase, setCashBase] = useState({ amount: 0, setAt: null });
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 860 : false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [recoveryKeyModalOpen, setRecoveryKeyModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("scv_theme") || "dark"; } catch (e) { return "dark"; }
  });
  C = theme === "light" ? LIGHT_THEME : DARK_THEME;
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem("scv_theme", next); } catch (e) { /* entorno sin localStorage */ }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [platformModal, setPlatformModal] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [resellerModal, setResellerModal] = useState(null);
  const [resellerAccessModal, setResellerAccessModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(null);
  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const keys = ["platforms", "profiles", "resellers", "expenses", "users", "logs", "groupColors", "ledger", "closures", "cashBase"];
        const results = await Promise.all(
          keys.map((k) => storage.get(k).catch(() => null))
        );
        const [p, pr, r, e, u, lg, gc, ld, cls, cb] = results.map((res) => (res ? JSON.parse(res.value) : null));
        setPlatforms(p || []);
        setProfiles(pr || []);
        setResellers(r || []);
        setExpenses(e || []);
        setUsers(u || []);
        setLogs(lg || []);
        setGroupColors(gc || {});
        setLedger(ld || []);
        setClosures(cls || []);
        setCashBase(cb || { amount: 0, setAt: null });

        // Restaurar sesión guardada (si el usuario sigue existiendo)
        try {
          const savedId = localStorage.getItem("scv_session");
          if (savedId) {
            const match = (u || []).find((usr) => usr.id === savedId);
            if (match) setCurrentUser(match);
            else localStorage.removeItem("scv_session");
          }
        } catch (e) {
          // localStorage no disponible en este entorno (ej. vista previa embebida); se ignora sin romper la app.
        }
      } catch (err) {
        console.error("Error cargando datos", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (key, data) => {
    try {
      await storage.set(key, JSON.stringify(data));
    } catch (err) {
      console.error("Error guardando", key, err);
    }
  };

  const updatePlatforms = (next) => { setPlatforms(next); save("platforms", next); };
  const updateProfiles = (next) => { setProfiles(next); save("profiles", next); };
  const updateResellers = (next) => { setResellers(next); save("resellers", next); };
  const updateExpenses = (next) => { setExpenses(next); save("expenses", next); };
  const updateUsers = (next) => { setUsers(next); save("users", next); };
  const updateGroupColors = (next) => { setGroupColors(next); save("groupColors", next); };
  const updateLedger = (next) => { setLedger(next); save("ledger", next); };
  const updateClosures = (next) => { setClosures(next); save("closures", next); };
  const updateCashBase = (next) => { setCashBase(next); save("cashBase", next); };

  const addLedgerEntry = (type, amount, label) => {
    const entry = { id: uid(), timestamp: new Date().toISOString(), type, amount, label };
    updateLedger([entry, ...ledger]);
  };

  const renewPlatform = (p) => {
    const nextExp = addDays(p.expDate, 30);
    const next = platforms.map((x) => x.id === p.id ? { ...x, expDate: nextExp } : x);
    updatePlatforms(next);
    addLog("Plataforma renovada", `${p.name} · ${p.email} · nueva fecha ${fmtDate(nextExp)}`);
    if (Number(p.cost) > 0) addLedgerEntry("renovacion_plataforma", -Number(p.cost), `Renovación ${p.name} · ${p.email}`);
  };

  const closeMonth = (newBaseAmount) => {
    const ventas = ledger.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
    const gastos = ledger.filter((l) => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);
    const ganancia = ventas - gastos;
    const cajaFinal = (cashBase.amount || 0) + ganancia;
    const closure = {
      id: uid(),
      date: new Date().toISOString(),
      base: cashBase.amount || 0,
      ventas, gastos, ganancia, cajaFinal,
      entries: ledger,
    };
    updateClosures([closure, ...closures]);
    updateLedger([]);
    updateCashBase({ amount: Number(newBaseAmount) || 0, setAt: new Date().toISOString() });
    addLog("Cierre de mes", `Ganancia: ${fmtMoney(ganancia)} · Caja final: ${fmtMoney(cajaFinal)} · Nueva base: ${fmtMoney(Number(newBaseAmount) || 0)}`);
  };

  const loginAs = (user) => {
    setCurrentUser(user);
    try { localStorage.setItem("scv_session", user.id); } catch (e) { /* entorno sin localStorage */ }
  };
  const logout = () => {
    setCurrentUser(null);
    try { localStorage.removeItem("scv_session"); } catch (e) { /* entorno sin localStorage */ }
  };

  const generateRecoveryKey = () => {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    const key = `SC-${segment()}-${segment()}-${segment()}`;
    const next = users.map((u) => u.id === currentUser.id ? { ...u, recoveryKey: key } : u);
    updateUsers(next);
    setCurrentUser({ ...currentUser, recoveryKey: key });
    return key;
  };

  const addLog = (action, detail) => {
    const entry = {
      id: uid(),
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || currentUser?.username || "Sistema",
      userRole: currentUser?.role || "—",
      action, detail,
    };
    const next = [entry, ...logs].slice(0, 300);
    setLogs(next); save("logs", next);
  };

  const renewProfile = (p) => {
    const next = profiles.map((x) => x.id === p.id ? { ...x, cutDate: addDays(x.cutDate, 30), cancelled: false } : x);
    updateProfiles(next);
    addLog("Cliente renovado (30 días)", `${p.clientName} · ${platformName(p.platformId)}`);
    if (Number(p.price) > 0) addLedgerEntry("renovacion_cliente", Number(p.price), `Renovación ${p.clientName} · ${platformName(p.platformId)}`);
  };
  const cancelProfile = (p) => {
    const next = profiles.map((x) => x.id === p.id ? { ...x, cancelled: true } : x);
    updateProfiles(next);
    addLog("Cliente retiró el servicio", `${p.clientName} · ${platformName(p.platformId)}`);
  };
  const deleteProfile = (id) => {
    const target = profiles.find((p) => p.id === id);
    updateProfiles(profiles.filter((p) => p.id !== id));
    addLog("Perfil eliminado", target ? `${target.clientName} · ${platformName(target.platformId)}` : "—");
  };

  const stats = useMemo(() => {
    const totalSales = profiles.reduce((s, p) => s + (Number(p.price) || 0), 0);
    const platformCost = platforms.reduce((s, p) => s + (Number(p.cost) || 0), 0);
    const manualExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpenses = platformCost + manualExpenses;
    const profit = totalSales - totalExpenses;
    const activeProfiles = profiles.filter((p) => !p.cancelled);
    const soon = activeProfiles.filter((p) => { const d = daysUntil(p.cutDate); return d >= 0 && d <= 3; });
    const expired = activeProfiles.filter((p) => daysUntil(p.cutDate) < 0);
    return { totalSales, totalExpenses, profit, activeCount: activeProfiles.length, soon, expired };
  }, [profiles, platforms, expenses]);

  const platformName = (id) => platforms.find((p) => p.id === id)?.name || "—";
  const resellerName = (id) => resellers.find((r) => r.id === id)?.name || "Directo";
  const platformEmail = (id) => platforms.find((p) => p.id === id)?.email || "—";

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "Inter, sans-serif" }}>
        Cargando panel...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <FirstRunSetup
        theme={theme} onToggleTheme={toggleTheme}
        onCreate={(owner) => {
          const next = [{ id: uid(), ...owner, role: "owner" }];
          updateUsers(next);
          loginAs(next[0]);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        theme={theme} onToggleTheme={toggleTheme}
        users={users}
        onLogin={(u) => loginAs(u)}
        onResetOwner={() => {
          updateUsers([]);
          try { localStorage.removeItem("scv_session"); } catch (e) { /* entorno sin localStorage */ }
        }}
      />
    );
  }

  if (currentUser.role === "reseller") {
    const myReseller = resellers.find((r) => r.id === currentUser.resellerId);
    if (!myReseller) {
      return (
        <AuthShell theme={theme} onToggleTheme={toggleTheme}>
          <p style={{ color: C.text, fontSize: 14.5, lineHeight: 1.6 }}>
            Tu acceso no está vinculado a ningún revendedor activo. Pide al dueño que revise tu acceso.
          </p>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={logout}><LogOut size={15} />Cerrar sesión</button>
        </AuthShell>
      );
    }
    return (
      <ResellerPortal
        reseller={myReseller}
        platforms={platforms}
        profiles={profiles}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        dollar={dollar}
      />
    );
  }

  const isOwner = currentUser.role === "owner";

  const navItems = [
    { key: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { key: "availability", label: "Disponibilidad", icon: PieChart },
    { key: "platforms", label: "Plataformas", icon: Tv },
    { key: "profiles", label: "Clientes", icon: Users },
    { key: "resellers", label: "Revendedores", icon: UserCheck },
    ...(isOwner ? [{ key: "admins", label: "Empleados", icon: Shield }] : []),
    ...(isOwner ? [{ key: "history", label: "Historial", icon: History }] : []),
    ...(isOwner ? [{ key: "finances", label: "Finanzas", icon: Wallet }] : []),
    ...(isOwner ? [{ key: "security", label: "Seguridad", icon: KeyRound }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #5A6773; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 12px; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; padding: 8px 10px; border-bottom: 1px solid ${C.border}; }
        td { padding: 10px; border-bottom: 1px solid ${C.border}; font-size: 14.5px; vertical-align: middle; }
        select { width: 100%; background: ${C.panel2}; border: 1px solid ${C.border}; border-radius: 8px; padding: 9px 11px; color: ${C.text}; font-size: 14.5px; margin-top: 4px; }
        button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 1px; }
      `}</style>

      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(5,8,11,0.6)", zIndex: 45 }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: 210, background: C.panel, borderRight: `1px solid ${C.border}`, padding: "22px 14px",
          display: "flex", flexDirection: "column", gap: 4, flexShrink: 0,
          ...(isMobile
            ? {
                position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
                transform: mobileNavOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.2s ease",
              }
            : {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 22px 8px" }}>
          <img src={LOGO_ICON} alt="Serviciocolven" style={{ height: 26, width: "auto" }} />
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setMobileNavOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
                background: active ? C.panel2 : "transparent", border: "none",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                color: active ? C.text : C.muted, cursor: "pointer", fontSize: 14.5, fontWeight: 600,
                textAlign: "left", fontFamily: "Inter, sans-serif",
              }}
            >
              <Icon size={16} />
              {item.label}
              {item.key === "dashboard" && (stats.soon.length + stats.expired.length > 0) && (
                <span style={{ marginLeft: "auto", background: C.danger, color: "#fff", fontSize: 11.5, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>
                  {stats.soon.length + stats.expired.length}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "10px 8px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Datos compartidos entre todos los socios con acceso a este panel.
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: isOwner ? C.accent : C.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {isOwner ? <Shield size={13} color="#fff" /> : <UserCog size={13} color={C.muted} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.name || currentUser.username}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{isOwner ? "Dueño" : "Empleado"}</div>
            </div>
            <button style={iconBtnStyle} title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"} onClick={toggleTheme}>
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button style={iconBtnStyle} title="Cerrar sesión" onClick={logout}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: isMobile ? "16px 14px" : "28px 34px", overflowY: "auto", width: "100%", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <button
              onClick={() => setMobileNavOpen(true)}
              style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, color: C.text, cursor: "pointer", display: "flex" }}
            >
              <Menu size={18} />
            </button>
            <img src={LOGO_ICON} alt="Serviciocolven" style={{ height: 22, width: "auto" }} />
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard stats={stats} platforms={platforms} platformName={platformName} platformEmail={platformEmail} resellerName={resellerName} isOwner={isOwner} onRenew={renewProfile} onDeleteProfile={deleteProfile} dollar={dollar} />
        )}
        {tab === "availability" && (
          <AvailabilityTab platforms={platforms} profiles={profiles} groupColors={groupColors} onSetColor={(name, color) => updateGroupColors({ ...groupColors, [name]: color })} />
        )}
        {tab === "platforms" && (
          <PlatformsTab
            platforms={platforms} profiles={profiles} resellers={resellers} platformName={platformName} resellerName={resellerName}
            onEditProfile={(p) => setProfileModal(p)}
            onAdd={() => setPlatformModal({})}
            onEdit={(p) => setPlatformModal(p)}
            onRenew={renewPlatform}
            onDelete={(id) => {
              if (profiles.some((pr) => pr.platformId === id)) {
                alert("No puedes eliminar una plataforma que tiene perfiles asociados. Elimina primero los perfiles.");
                return;
              }
              const target = platforms.find((p) => p.id === id);
              updatePlatforms(platforms.filter((p) => p.id !== id));
              addLog("Plataforma eliminada", target?.name || "—");
            }}
          />
        )}
        {tab === "profiles" && (
          <ProfilesTab
            profiles={profiles} platforms={platforms} resellers={resellers}
            search={search} setSearch={setSearch}
            platformName={platformName} resellerName={resellerName}
            onAdd={() => setProfileModal({})}
            onEdit={(p) => setProfileModal(p)}
            onDeliver={(p) => setDeliveryProfile(p)}
            onRenew={renewProfile}
            onCancel={cancelProfile}
            onDelete={deleteProfile}
          />
        )}
        {tab === "resellers" && (
          <ResellersTab
            resellers={resellers} profiles={profiles} platforms={platforms} platformName={platformName}
            users={users}
            onManageAccess={(reseller, existingUser) => setResellerAccessModal({ reseller, existingUser })}
            onEditProfile={(p) => setProfileModal(p)}
            onAdd={() => setResellerModal({})}
            onEdit={(r) => setResellerModal(r)}
            onDelete={(id) => {
              if (profiles.some((p) => p.resellerId === id)) {
                alert("No puedes eliminar un revendedor con perfiles activos asignados.");
                return;
              }
              const target = resellers.find((r) => r.id === id);
              updateResellers(resellers.filter((r) => r.id !== id));
              addLog("Revendedor eliminado", target?.name || "—");
            }}
          />
        )}
        {tab === "finances" && isOwner && (
          <FinancesTab
            stats={stats} platforms={platforms} expenses={expenses}
            ledger={ledger} closures={closures} cashBase={cashBase}
            onSetCashBase={(amount) => updateCashBase({ amount: Number(amount) || 0, setAt: new Date().toISOString() })}
            onCloseMonth={closeMonth}
            onAddExpense={() => setExpenseModal({})}
            onDeleteExpense={(id) => {
              const target = expenses.find((e) => e.id === id);
              updateExpenses(expenses.filter((e) => e.id !== id));
              addLog("Gasto eliminado", target ? `${target.desc} · ${fmtMoney(target.amount)}` : "—");
            }}
          />
        )}
        {tab === "admins" && isOwner && (
          <AdminsTab
            users={users}
            onAdd={() => setAdminModal({})}
            onEdit={(u) => setAdminModal(u)}
            onDelete={(id) => {
              const target = users.find((u) => u.id === id);
              updateUsers(users.filter((u) => u.id !== id));
              addLog("Empleado eliminado", target?.name || "—");
            }}
          />
        )}
        {tab === "history" && isOwner && (
          <HistoryTab logs={logs} />
        )}
        {tab === "security" && isOwner && (
          <SecurityTab currentUser={currentUser} onGenerate={generateRecoveryKey} theme={theme} onToggleTheme={toggleTheme} />
        )}
      </div>

      {/* Modals */}
      <PlatformModal
        data={platformModal} onClose={() => setPlatformModal(null)}
        onSave={(p) => {
          if (p.id) {
            const prev = platforms.find((x) => x.id === p.id);
            updatePlatforms(platforms.map((x) => x.id === p.id ? p : x));
            if (prev && p.expDate > prev.expDate) {
              addLog("Plataforma recargada", `${p.name} · nueva fecha ${fmtDate(p.expDate)}`);
            } else {
              addLog("Plataforma editada", p.name);
            }
          } else {
            updatePlatforms([...platforms, { ...p, id: uid() }]);
            addLog("Plataforma agregada", `${p.name} · ${p.email}`);
            if (Number(p.cost) > 0) addLedgerEntry("gasto_plataforma", -Number(p.cost), `${p.name} · ${p.email}`);
          }
          setPlatformModal(null);
        }}
      />
      <ProfileModal
        data={profileModal} platforms={platforms} resellers={resellers} profiles={profiles} onClose={() => setProfileModal(null)}
        onSave={(p) => {
          if (p.id) {
            updateProfiles(profiles.map((x) => x.id === p.id ? p : x));
            addLog("Perfil editado", `${p.clientName} · ${platformName(p.platformId)}`);
          } else {
            updateProfiles([...profiles, { ...p, id: uid(), cancelled: false }]);
            addLog("Cliente agregado", `${p.clientName} · ${platformName(p.platformId)}`);
            if (Number(p.price) > 0) addLedgerEntry("venta", Number(p.price), `${p.clientName} · ${platformName(p.platformId)}`);
          }
          setProfileModal(null);
        }}
      />
      <DeliveryModal
        data={deliveryProfile} onClose={() => setDeliveryProfile(null)}
        platformName={platformName}
        platformEmail={(id) => platforms.find((p) => p.id === id)?.email || "—"}
        platformPassword={(id) => platforms.find((p) => p.id === id)?.password || "—"}
      />
      <AdminModal
        data={adminModal} users={users} onClose={() => setAdminModal(null)}
        onSave={(u) => {
          if (u.id) {
            updateUsers(users.map((x) => x.id === u.id ? { ...x, ...u } : x));
            addLog("Empleado editado", u.name);
          } else {
            updateUsers([...users, { ...u, id: uid(), role: "admin" }]);
            addLog("Empleado agregado", `${u.name} · ${u.username}`);
          }
          setAdminModal(null);
        }}
      />
      <ResellerModal
        data={resellerModal} platforms={platforms} onClose={() => setResellerModal(null)}
        onSave={(r) => {
          if (r.id) {
            updateResellers(resellers.map((x) => x.id === r.id ? r : x));
            addLog("Revendedor editado", r.name);
          } else {
            updateResellers([...resellers, { ...r, id: uid() }]);
            addLog("Revendedor agregado", r.name);
          }
          setResellerModal(null);
        }}
      />
      <ResellerAccessModal
        data={resellerAccessModal} onClose={() => setResellerAccessModal(null)}
        onSave={(u) => {
          if (u.id) {
            updateUsers(users.map((x) => x.id === u.id ? { ...x, ...u } : x));
            addLog("Acceso de revendedor editado", `${u.name} · ${u.username}`);
          } else {
            const dup = users.some((x) => x.username === u.username);
            if (dup) { alert("Ese nombre de usuario ya existe."); return; }
            updateUsers([...users, { ...u, id: uid() }]);
            addLog("Acceso de revendedor creado", `${u.name} · ${u.username}`);
          }
          setResellerAccessModal(null);
        }}
      />
      <ExpenseModal
        data={expenseModal} onClose={() => setExpenseModal(null)}
        onSave={(e) => {
          updateExpenses([...expenses, { ...e, id: uid() }]);
          addLog("Gasto agregado", `${e.desc} · ${fmtMoney(e.amount)}`);
          if (Number(e.amount) > 0) addLedgerEntry("gasto_manual", -Number(e.amount), e.desc);
          setExpenseModal(null);
        }}
      />
    </div>
  );
}

function AvailabilityTab({ platforms, profiles, groupColors, onSetColor }) {
  const [pickerFor, setPickerFor] = useState(null);

  const groups = {};
  platforms.forEach((p) => {
    const cap = p.capacity || 5;
    const extraCap = (p.extraEmails || []).length;
    const used = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type !== "extra").length;
    const usedExtra = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type === "extra").length;

    if (!groups[p.name]) groups[p.name] = { name: p.name, total: 0, used: 0, accounts: 0 };
    groups[p.name].total += cap;
    groups[p.name].used += used;
    groups[p.name].accounts += 1;

    if (extraCap > 0) {
      const extraKey = `${p.name} Perfil Extra`;
      if (!groups[extraKey]) groups[extraKey] = { name: extraKey, total: 0, used: 0, accounts: 0 };
      groups[extraKey].total += extraCap;
      groups[extraKey].used += usedExtra;
      groups[extraKey].accounts += 1;
    }
  });
  const groupList = Object.values(groups).sort((a, b) => (b.total - b.used) - (a.total - a.used));

  return (
    <div>
      <SectionHeader title="Disponibilidad" sub="Cuánto tienes libre de cada plataforma, sumando todas sus cuentas, para saber qué promocionar." />
      {groupList.length === 0 && <EmptyState text="Aún no has agregado plataformas." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {groupList.map((g) => {
          const free = g.total - g.used;
          const color = groupColors[g.name] || C.accent;
          return (
            <div key={g.name} style={{ background: C.panel, border: `1px solid ${C.border}`, borderTop: `4px solid ${color}`, borderRadius: 12, padding: 18, position: "relative" }}>
              <button
                onClick={() => setPickerFor(pickerFor === g.name ? null : g.name)}
                title="Cambiar color"
                style={{ position: "absolute", top: 14, right: 14, width: 20, height: 20, borderRadius: "50%", background: color, border: `2px solid ${C.border}`, cursor: "pointer" }}
              />
              {pickerFor === g.name && (
                <div style={{ position: "absolute", top: 40, right: 14, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, zIndex: 10, display: "flex", flexWrap: "wrap", gap: 6, width: 168 }}>
                  {PLATFORM_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => { onSetColor(g.name, c); setPickerFor(null); }}
                      style={{
                        width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer",
                        border: color === c ? `2px solid ${C.text}` : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              )}
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 10, paddingRight: 26 }}>{g.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "Sora, sans-serif", fontSize: 30, fontWeight: 800, color: free > 0 ? C.accent2 : C.danger }}>{free}</span>
                <span style={{ fontSize: 13.5, color: C.muted }}>disponibles</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Total {g.total} · {g.accounts} cuenta{g.accounts === 1 ? "" : "s"}</div>
              <div style={{ marginTop: 12, height: 6, borderRadius: 4, background: C.border, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (g.used / g.total) * 100)}%`, height: "100%", background: free > 0 ? color : C.danger }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ stats, platforms, platformName, platformEmail, resellerName, isOwner, onRenew, onDeleteProfile, dollar }) {
  const alerts = [...stats.expired, ...stats.soon];
  const [renewalProfile, setRenewalProfile] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [search, setSearch] = useState("");
  const platformsDue = (platforms || [])
    .filter((p) => daysUntil(p.expDate) <= 3)
    .sort((a, b) => daysUntil(a.expDate) - daysUntil(b.expDate));

  const filteredAlerts = alerts.filter((p) =>
    p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    platformName(p.platformId).toLowerCase().includes(search.toLowerCase()) ||
    platformEmail(p.platformId).toLowerCase().includes(search.toLowerCase()) ||
    resellerName(p.resellerId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 800, margin: "0 0 4px 0" }}>Resumen general</h1>
      <p style={{ color: C.muted, fontSize: 14.5, margin: "0 0 24px 0" }}>Estado actual del negocio, acumulado histórico.</p>
      {dollar && <DollarRateBanner dollar={dollar} />}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
        {isOwner && <KPI label="Ventas totales" value={fmtMoney(stats.totalSales)} color={C.accent2} />}
        {isOwner && <KPI label="Gastos totales" value={fmtMoney(stats.totalExpenses)} color={C.warn} />}
        {isOwner && <KPI label="Ganancia neta" value={fmtMoney(stats.profit)} color={stats.profit >= 0 ? C.success : C.danger} />}
        <KPI label="Perfiles activos" value={stats.activeCount} />
        <KPI label="Por vencer / vencidos" value={alerts.length} color={alerts.length ? C.danger : C.text} />
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <AlertTriangle size={16} color={C.warn} />
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: 0 }}>Vencimientos próximos</h3>
        </div>
        {alerts.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>No hay perfiles por vencer en los próximos días.</div>}
        {alerts.length > 0 && (
          <>
            <div style={{ position: "relative", marginBottom: 14, maxWidth: 320 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.muted }} />
              <input style={{ ...inputStyle, paddingLeft: 30, marginTop: 0 }} placeholder="Buscar cliente, correo, plataforma o revendedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {filteredAlerts.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>Ningún cliente por vencer coincide con la búsqueda.</div>}
            {filteredAlerts.length > 0 && (
              <div style={{ overflowX: "auto" }}><table>
                <thead><tr><th>Cliente</th><th>Correo</th><th>Plataforma</th><th>Revendedor</th><th>Corte</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {filteredAlerts.sort((a, b) => daysUntil(a.cutDate) - daysUntil(b.cutDate)).map((p) => {
                    const st = statusFor(p.cutDate, p.cancelled);
                    return (
                      <tr key={p.id}>
                        <td>{p.clientName}</td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{platformEmail(p.platformId)}</td>
                        <td>{platformName(p.platformId)}</td>
                        <td>{resellerName(p.resellerId)}</td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtDate(p.cutDate)}</td>
                        <td><span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <button
                              style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5 }}
                              onClick={() => setRenewalProfile(p)}
                              title="Ver mensaje de aviso"
                            >
                              <Send size={12} />Ver aviso
                            </button>
                            <button
                              style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5 }}
                              onClick={() => onRenew(p)}
                              title="Renovar 30 días"
                        >
                          <RefreshCw size={12} />Renovar
                        </button>
                        <button
                          style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5, color: C.danger, borderColor: C.danger }}
                          onClick={() => { if (confirmingDelete === p.id) { onDeleteProfile(p.id); setConfirmingDelete(null); } else { setConfirmingDelete(p.id); } }}
                          title="Eliminar perfil"
                        >
                          <Trash2 size={12} />{confirmingDelete === p.id ? "¿Seguro?" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
                </tbody>
              </table></div>
            )}
          </>
        )}
      </div>

      {platformsDue.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={16} color={C.warn} />
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: 0 }}>Cuentas que hay que pagar</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {platformsDue.map((p) => {
              const days = daysUntil(p.expDate);
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color || C.muted, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12.5, color: C.muted }}>{p.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: days < 0 ? C.danger : C.warn }}>
                      {days < 0 ? `Vencida hace ${Math.abs(days)}d` : days === 0 ? "Vence hoy" : `Vence en ${days}d`}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>Pagar esta cuenta{isOwner ? ` · ${fmtMoney(p.cost)}/mes` : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <RenewalModal data={renewalProfile} onClose={() => setRenewalProfile(null)} />
    </div>
  );
}

function RenewalModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const text =
    `Nombre: ${data.clientName}\n` +
    `Fecha de corte: ${fmtDate(data.cutDate)}\n\n` +
    `Estimado usuario, le informamos que este servicio está próximo a vencer. Por favor infórmenos si desea renovar.`;
  return (
    <Modal open={!!data} onClose={onClose} title="Mensaje de aviso de vencimiento">
      <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
        {text}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            navigator.clipboard?.writeText(text)
              .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
              .catch(() => alert("No se pudo copiar automáticamente. Selecciona el texto de arriba y cópialo manualmente (Ctrl+C)."));
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copiado" : "Copiar mensaje"}
        </button>
        <button style={btnGhost} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

function SectionHeader({ title, sub, onAdd, addLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 800, margin: "0 0 4px 0" }}>{title}</h1>
        {sub && <p style={{ color: C.muted, fontSize: 14.5, margin: 0 }}>{sub}</p>}
      </div>
      {onAdd && <button style={btnPrimary} onClick={onAdd}><Plus size={15} />{addLabel}</button>}
    </div>
  );
}

function PlatformsTab({ platforms, profiles, resellers, platformName, resellerName, onAdd, onEdit, onDelete, onEditProfile, onRenew }) {
  const platformEmail = (id) => platforms.find((p) => p.id === id)?.email || "—";
  const [availFilter, setAvailFilter] = useState("all"); // all | available | full
  const [nameFilter, setNameFilter] = useState("all");
  const [viewingProfile, setViewingProfile] = useState(null);
  const [emailQuery, setEmailQuery] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [confirmingRenew, setConfirmingRenew] = useState(null);
  const [emailExportOpen, setEmailExportOpen] = useState(false);
  const resellerColor = (resellerId) => resellers.find((r) => r.id === resellerId)?.color || C.muted;

  const withAvailability = platforms.map((p) => {
    const used = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type !== "extra").length;
    const cap = p.capacity || 5;
    const extraEmails = p.extraEmails || [];
    const usedExtraEmails = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type === "extra").map((pr) => pr.extraSlotEmail);
    const freeExtra = extraEmails.filter((em) => !usedExtraEmails.includes(em)).length;
    const hasFree = used < cap || freeExtra > 0;
    return { ...p, hasFree };
  });

  const distinctNames = Array.from(new Set(platforms.map((p) => p.name))).sort();

  let filtered = withAvailability;
  if (availFilter === "available") filtered = filtered.filter((p) => p.hasFree);
  if (availFilter === "full") filtered = filtered.filter((p) => !p.hasFree);
  if (nameFilter !== "all") filtered = filtered.filter((p) => p.name === nameFilter);
  if (emailSearch.trim()) {
    const q = emailSearch.trim().toLowerCase();
    filtered = filtered.filter((p) =>
      (p.email || "").toLowerCase().includes(q) ||
      (p.extraEmails || []).some((em) => em.toLowerCase().includes(q))
    );
  }

  const sorted = [...filtered].sort((a, b) => daysUntil(a.expDate) - daysUntil(b.expDate));

  const pillBtn = (active) => ({
    background: active ? C.accent : "transparent",
    color: active ? "#fff" : C.muted,
    border: `1px solid ${active ? C.accent : C.border}`,
    borderRadius: 999, padding: "6px 13px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
  });

  return (
    <div>
      <SectionHeader title="Plataformas" sub="Cuentas madre activas y sus credenciales, ordenadas por vencimiento." onAdd={onAdd} addLabel="Nueva plataforma" />
      {platforms.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button style={{ ...btnGhost, padding: "8px 14px", fontSize: 13.5 }} onClick={() => setEmailExportOpen(true)}>
            <Download size={14} />Lista de correos
          </button>
        </div>
      )}
      {platforms.length === 0 && <EmptyState text="Aún no has agregado ninguna plataforma. Crea la primera." />}

      {platforms.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              style={{ ...inputStyle, marginTop: 0, width: 220 }}
              placeholder="Buscar por correo..."
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setEmailSearch(emailQuery); }}
            />
            <button style={{ ...btnGhost, padding: "9px 12px" }} onClick={() => setEmailSearch(emailQuery)}>
              <Search size={14} />
            </button>
            {emailSearch && (
              <button style={{ ...btnGhost, padding: "9px 12px" }} onClick={() => { setEmailQuery(""); setEmailSearch(""); }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={pillBtn(availFilter === "all")} onClick={() => setAvailFilter("all")}>Mostrar todo</button>
            <button style={pillBtn(availFilter === "available")} onClick={() => setAvailFilter("available")}>Con cupos</button>
            <button style={pillBtn(availFilter === "full")} onClick={() => setAvailFilter("full")}>Llenas</button>
          </div>
          {distinctNames.length > 1 && (
            <select value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="all">Todas las plataformas</option>
              {distinctNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
      )}

      {platforms.length > 0 && sorted.length === 0 && <EmptyState text="No hay plataformas que coincidan con este filtro." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {sorted.map((p) => {
          const stdProfiles = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type !== "extra");
          const used = stdProfiles.length;
          const cap = p.capacity || 5;
          const extraEmails = p.extraEmails || [];
          const extraProfiles = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type === "extra");
          const expDays = daysUntil(p.expDate);
          const expColor = expDays < 0 ? C.danger : expDays <= 3 ? C.warn : C.muted;
          return (
            <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderTop: `3px solid ${p.color || C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color || C.muted, flexShrink: 0 }} />
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                    {used}/{cap} estándar{extraEmails.length > 0 ? ` · ${extraProfiles.length}/${extraEmails.length} extra` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <button style={iconBtnStyle} onClick={() => onEdit(p)}><Pencil size={14} /></button>
                  <button style={iconBtnStyle} onClick={() => onDelete(p.id)}><Trash2 size={14} color={C.danger} /></button>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13.5, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Correo</span><span style={{ display: "flex", gap: 4, alignItems: "center" }}>{p.email}<CopyBtn value={p.email} /></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.muted }}>Contraseña</span><SecretText value={p.password} /></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Vence</span><span style={{ fontFamily: "JetBrains Mono, monospace", color: expColor, fontWeight: 600 }}>{fmtDate(p.expDate)} {expDays < 0 ? "· vencida" : expDays <= 3 ? `· ${expDays}d` : ""}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Costo mensual</span><span>{fmtMoney(p.cost)}</span></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  style={{ ...btnGhost, width: "100%", justifyContent: "center", padding: "7px 10px", fontSize: 12.5 }}
                  onClick={() => {
                    if (confirmingRenew === p.id) {
                      onRenew(p);
                      setConfirmingRenew(null);
                    } else {
                      setConfirmingRenew(p.id);
                    }
                  }}
                >
                  <RefreshCw size={13} />
                  {confirmingRenew === p.id ? `¿Confirmar pago de ${fmtMoney(p.cost)}?` : "Renovar 30 días"}
                </button>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 4, background: C.border, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (used / cap) * 100)}%`, height: "100%", background: used >= cap ? C.danger : C.accent2 }} />
              </div>

              {stdProfiles.length > 0 && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Clientes en esta cuenta</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {stdProfiles.map((pr) => {
                      const bg = resellerColor(pr.resellerId);
                      return (
                        <button
                          key={pr.id}
                          title={resellers.find((r) => r.id === pr.resellerId)?.name || "Directo"}
                          onClick={() => setViewingProfile(pr)}
                          style={{ background: bg, color: contrastText(bg), fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 999, border: "none", cursor: "pointer" }}
                        >
                          {pr.clientName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {extraEmails.length > 0 && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Correos extra</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {extraEmails.map((em, i) => {
                      const owner = extraProfiles.find((pr) => pr.extraSlotEmail === em);
                      const bg = owner ? resellerColor(owner.resellerId) : null;
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{em}</span>
                          {owner ? (
                            <button
                              onClick={() => setViewingProfile(owner)}
                              style={{ background: bg, color: contrastText(bg), fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "none", cursor: "pointer" }}
                            >
                              {owner.clientName}
                            </button>
                          ) : (
                            <span style={{ color: C.accent2, fontSize: 12 }}>Libre</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ProfileDetailModal profile={viewingProfile} onClose={() => setViewingProfile(null)} platformName={platformName} platformEmail={platformEmail} resellerName={resellerName} onEdit={onEditProfile} />
      <EmailExportModal open={emailExportOpen} onClose={() => setEmailExportOpen(false)} platforms={platforms} profiles={profiles} resellers={resellers} />
    </div>
  );
}

function ProfileDetailModal({ profile, onClose, platformName, platformEmail, resellerName, onEdit }) {
  if (!profile) return null;
  const p = profile;
  const st = statusFor(p.cutDate, p.cancelled);
  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14.5 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
  return (
    <Modal open={!!profile} onClose={onClose} title={p.clientName}>
      <div>
        {row("Plataforma", `${platformName(p.platformId)}${p.type === "extra" ? " (Perfil Extra)" : ""}`)}
        {row("Revendedor", resellerName(p.resellerId))}
        {p.type === "extra"
          ? row("Correo del perfil", p.clientEmail)
          : row("Correo", platformEmail ? platformEmail(p.platformId) : "—")}
        {p.type === "extra"
          ? row("Contraseña del perfil", p.clientPassword || "—")
          : row("PIN", p.pin || "—")}
        {row("Fecha de inicio", fmtDate(p.startDate))}
        {row("Fecha de corte", fmtDate(p.cutDate))}
        {row("Precio de venta", fmtMoney(p.price))}
        {row("Estado", <span style={{ color: st.color }}>{st.label}</span>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {onEdit && (
          <button style={btnPrimary} onClick={() => { onEdit(p); onClose(); }}>
            <Pencil size={15} />Editar perfil
          </button>
        )}
        <button style={btnGhost} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

function ProfilesTab({ profiles, platforms, resellers, search, setSearch, platformName, resellerName, onAdd, onEdit, onDeliver, onRenew, onCancel, onDelete }) {
  const platformEmail = (id) => platforms.find((p) => p.id === id)?.email || "—";
  const [viewingProfile, setViewingProfile] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { id, action: 'renew'|'cancel'|'delete' }
  const filtered = profiles
    .filter((p) => {
      const q = search.toLowerCase();
      const correo = p.type === "extra" ? (p.clientEmail || "") : platformEmail(p.platformId);
      return (
        p.clientName?.toLowerCase().includes(q) ||
        platformName(p.platformId).toLowerCase().includes(q) ||
        resellerName(p.resellerId).toLowerCase().includes(q) ||
        correo.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!!a.cancelled !== !!b.cancelled) return a.cancelled ? 1 : -1;
      return daysUntil(a.cutDate) - daysUntil(b.cutDate);
    });
  return (
    <div>
      <SectionHeader title="Clientes / Perfiles" sub="Perfiles vendidos dentro de cada plataforma." onAdd={onAdd} addLabel="Nuevo perfil" />
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.muted }} />
        <input style={{ ...inputStyle, paddingLeft: 30, marginTop: 0 }} placeholder="Buscar cliente, correo, plataforma o revendedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 && <EmptyState text="No hay perfiles que coincidan." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map((p) => {
          const st = statusFor(p.cutDate, p.cancelled);
          return (
            <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
              <Ring days={st.days ?? 0} color={st.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setViewingProfile(p)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.text, textDecoration: "underline", textDecorationColor: C.border, textUnderlineOffset: 3 }}
                    title="Ver detalle completo"
                  >
                    {p.clientName}
                  </button>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button style={iconBtnStyle} onClick={() => onEdit(p)}><Pencil size={13} /></button>
                    <button style={iconBtnStyle} onClick={() => setConfirmAction({ profile: p, action: "delete" })}><Trash2 size={13} color={C.danger} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: platforms.find((pl) => pl.id === p.platformId)?.color || C.muted, flexShrink: 0 }} />
                  {platformName(p.platformId)}{p.type === "extra" ? " · Extra" : ""} · {resellerName(p.resellerId)}
                </div>
                <div style={{ fontSize: 13.5, display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.type === "extra" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.muted }}>Correo del perfil</span><span style={{ display: "flex", gap: 4, alignItems: "center" }}>{p.clientEmail}<CopyBtn value={p.clientEmail} /></span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.muted }}>Contraseña</span><SecretText value={p.clientPassword} /></div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.muted }}>Correo</span><span style={{ display: "flex", gap: 4, alignItems: "center" }}>{platformEmail(p.platformId)}<CopyBtn value={platformEmail(p.platformId)} /></span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.muted }}>PIN</span><SecretText value={p.pin} /></div>
                    </>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Corte</span><span style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtDate(p.cutDate)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Precio</span><span>{fmtMoney(p.price)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Estado</span><span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span></div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <button style={{ ...btnGhost, padding: "6px 10px", fontSize: 13 }} onClick={() => onDeliver(p)}><Send size={12} />Entregar</button>
                  <button style={{ ...btnGhost, padding: "6px 10px", fontSize: 13 }} onClick={() => setConfirmAction({ profile: p, action: "renew" })}><RefreshCw size={12} />Renovar 30d</button>
                  {!p.cancelled && <button style={{ ...btnGhost, padding: "6px 10px", fontSize: 13 }} onClick={() => setConfirmAction({ profile: p, action: "cancel" })}><LogOut size={12} />Retirar</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ProfileDetailModal profile={viewingProfile} onClose={() => setViewingProfile(null)} platformName={platformName} platformEmail={platformEmail} resellerName={resellerName} onEdit={onEdit} />

      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirmar acción">
        {confirmAction && (() => {
          const { profile: p, action } = confirmAction;
          const texts = {
            renew: { msg: `¿Renovar 30 días a ${p.clientName}?`, btn: "Sí, renovar", danger: false },
            cancel: { msg: `¿Marcar a ${p.clientName} como retirado del servicio?`, btn: "Sí, retirar", danger: true },
            delete: { msg: `¿Eliminar el perfil de ${p.clientName}? Esta acción no se puede deshacer.`, btn: "Sí, eliminar", danger: true },
          };
          const t = texts[action];
          return (
            <div>
              <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.6, marginBottom: 18 }}>{t.msg}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...btnPrimary, ...(t.danger ? { background: C.danger } : {}) }}
                  onClick={() => {
                    if (action === "renew") onRenew(p);
                    if (action === "cancel") onCancel(p);
                    if (action === "delete") onDelete(p.id);
                    setConfirmAction(null);
                  }}
                >
                  {t.btn}
                </button>
                <button style={btnGhost} onClick={() => setConfirmAction(null)}>Cancelar</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function ResellerReportModal({ data, onClose, platformName, platformEmail }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const { reseller, clients } = data;
  const lines = clients.map((c) => {
    const correo = c.type === "extra" ? c.clientEmail : platformEmail(c.platformId);
    return `Nombre: ${c.clientName} | Plataforma: ${platformName(c.platformId)}${c.type === "extra" ? " (Extra)" : ""} | Correo: ${correo} | Fecha: ${fmtDate(c.cutDate)}`;
  });
  const text = `Revendedor ${reseller.name}\n\nClientes:\n` + lines.join("\n");
  return (
    <Modal open={!!data} onClose={onClose} title={`Reporte de ${reseller.name}`} wide>
      <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 380, overflowY: "auto" }}>
        {text}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            navigator.clipboard?.writeText(text)
              .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
              .catch(() => alert("No se pudo copiar automáticamente. Selecciona el texto de arriba y cópialo manualmente (Ctrl+C)."));
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copiado" : "Copiar reporte"}
        </button>
        <button style={btnGhost} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

function ResellersTab({ resellers, profiles, platforms, platformName, onAdd, onEdit, onDelete, onEditProfile, users, onManageAccess }) {
  const platformEmail = (id) => platforms.find((p) => p.id === id)?.email || "—";
  const [viewingReseller, setViewingReseller] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [reportReseller, setReportReseller] = useState(null);
  const [clientPlatformFilter, setClientPlatformFilter] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all"); // all | standard | extra
  const [clientStatusFilter, setClientStatusFilter] = useState("all"); // all | expiring
  const [search, setSearch] = useState("");
  const filteredResellers = resellers.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) || (r.contact || "").toLowerCase().includes(search.toLowerCase())
  );

  const getFilteredClients = (resellerId) => {
    let list = profiles.filter((p) => p.resellerId === resellerId);
    if (clientPlatformFilter !== "all") list = list.filter((c) => platformName(c.platformId) === clientPlatformFilter);
    if (clientTypeFilter !== "all") list = list.filter((c) => (clientTypeFilter === "extra" ? c.type === "extra" : c.type !== "extra"));
    if (clientStatusFilter === "expiring") list = list.filter((c) => !c.cancelled && daysUntil(c.cutDate) <= 3);
    return list.sort((a, b) => daysUntil(a.cutDate) - daysUntil(b.cutDate));
  };

  return (
    <div>
      <SectionHeader title="Revendedores" sub="Personas que venden perfiles a nombre del negocio." onAdd={onAdd} addLabel="Nuevo revendedor" />
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.muted }} />
        <input style={{ ...inputStyle, paddingLeft: 30, marginTop: 0 }} placeholder="Buscar revendedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {resellers.length === 0 && <EmptyState text="Aún no has agregado revendedores." />}
      {resellers.length > 0 && filteredResellers.length === 0 && <EmptyState text="Ningún revendedor coincide con la búsqueda." />}
      {filteredResellers.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Perfiles asignados</th><th>Ventas generadas</th><th>Acceso</th><th></th></tr></thead>
            <tbody>
              {filteredResellers.map((r) => {
                const assigned = profiles.filter((p) => p.resellerId === r.id);
                const total = assigned.reduce((s, p) => s + (Number(p.price) || 0), 0);
                const resellerUser = (users || []).find((u) => u.resellerId === r.id);
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: r.color || C.muted, flexShrink: 0 }} />
                        {r.name}
                      </span>
                    </td>
                    <td>{r.contact || "—"}</td>
                    <td>{assigned.length}</td>
                    <td>{fmtMoney(total)}</td>
                    <td>
                      {resellerUser ? (
                        <span style={{ fontSize: 12.5, color: C.accent2, fontFamily: "JetBrains Mono, monospace" }}>{resellerUser.username}</span>
                      ) : (
                        <span style={{ fontSize: 12.5, color: C.muted }}>Sin acceso</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <button
                          style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5 }}
                          onClick={() => {
                            setViewingReseller(r);
                            setClientPlatformFilter("all"); setClientTypeFilter("all"); setClientStatusFilter("all");
                          }}
                        >Ver clientes</button>
                        <button
                          style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5 }}
                          onClick={() => onManageAccess(r, resellerUser)}
                        ><KeyRound size={12} />{resellerUser ? "Editar acceso" : "Crear acceso"}</button>
                        <button style={iconBtnStyle} onClick={() => onEdit(r)}><Pencil size={14} /></button>
                        <button style={iconBtnStyle} onClick={() => onDelete(r.id)}><Trash2 size={14} color={C.danger} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}

      <Modal open={!!viewingReseller} onClose={() => setViewingReseller(null)} title={viewingReseller ? `Clientes de ${viewingReseller.name}` : ""} wide>
        {viewingReseller && (() => {
          const allClients = profiles.filter((p) => p.resellerId === viewingReseller.id);
          if (allClients.length === 0) return <div style={{ color: C.muted, fontSize: 14.5 }}>Este revendedor todavía no tiene clientes asignados.</div>;

          const platformsInUse = Array.from(new Set(allClients.map((c) => platformName(c.platformId)))).sort();
          const hasExtras = allClients.some((c) => c.type === "extra");
          const clients = getFilteredClients(viewingReseller.id);

          const pillBtn = (active) => ({
            background: active ? C.accent : "transparent",
            color: active ? "#fff" : C.muted,
            border: `1px solid ${active ? C.accent : C.border}`,
            borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
          });

          return (
            <div>
              {platformsInUse.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  <button style={pillBtn(clientPlatformFilter === "all")} onClick={() => setClientPlatformFilter("all")}>Todas</button>
                  {platformsInUse.map((n) => (
                    <button key={n} style={pillBtn(clientPlatformFilter === n)} onClick={() => setClientPlatformFilter(n)}>{n}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                <button style={pillBtn(clientStatusFilter === "all")} onClick={() => setClientStatusFilter(clientStatusFilter === "expiring" ? "all" : "expiring")}>
                  {clientStatusFilter === "expiring" ? "✓ " : ""}Por vencer (≤3 días)
                </button>
                {hasExtras && (
                  <button style={pillBtn(clientTypeFilter === "extra")} onClick={() => setClientTypeFilter(clientTypeFilter === "extra" ? "all" : "extra")}>
                    {clientTypeFilter === "extra" ? "✓ " : ""}Solo extras
                  </button>
                )}
                <button
                  style={{ ...btnGhost, padding: "5px 11px", fontSize: 12 }}
                  onClick={() => setReportReseller({ reseller: viewingReseller, clients })}
                  disabled={clients.length === 0}
                >
                  <Copy size={12} />Generar reporte
                </button>
              </div>
              {clients.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 14.5 }}>No hay clientes que coincidan con estos filtros.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                  {clients.map((c) => {
                    const st = statusFor(c.cutDate, c.cancelled);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setViewingClient(c)}
                        style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "Inter, sans-serif" }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: "underline", textDecorationColor: C.border, textUnderlineOffset: 3 }}>{c.clientName}</div>
                          <div style={{ fontSize: 12.5, color: C.muted }}>{platformName(c.platformId)}{c.type === "extra" ? " · Extra" : ""} · corte {fmtDate(c.cutDate)}</div>
                        </div>
                        <span style={{ color: st.color, fontWeight: 600, fontSize: 12.5 }}>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
        <div style={{ display: "flex", marginTop: 18 }}>
          <button style={btnGhost} onClick={() => setViewingReseller(null)}>Cerrar</button>
        </div>
      </Modal>

      <ResellerReportModal
        data={reportReseller} onClose={() => setReportReseller(null)}
        platformName={platformName} platformEmail={platformEmail}
      />

      <ProfileDetailModal
        profile={viewingClient} onClose={() => setViewingClient(null)}
        platformName={platformName}
        platformEmail={platformEmail}
        resellerName={(id) => resellers.find((r) => r.id === id)?.name || "Directo"}
        onEdit={onEditProfile}
      />
    </div>
  );
}

function FinancesTab({ stats, platforms, expenses, ledger, closures, cashBase, onSetCashBase, onCloseMonth, onAddExpense, onDeleteExpense }) {
  const [editingBase, setEditingBase] = useState(false);
  const [baseInput, setBaseInput] = useState(String(cashBase.amount || 0));
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [newBaseInput, setNewBaseInput] = useState("0");

  const ventasPeriodo = ledger.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const gastosPeriodo = ledger.filter((l) => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);
  const gananciaPeriodo = ventasPeriodo - gastosPeriodo;
  const cajaActual = (cashBase.amount || 0) + gananciaPeriodo;

  const typeLabels = {
    venta: "Venta", renovacion_cliente: "Renovación cliente",
    gasto_plataforma: "Plataforma nueva", renovacion_plataforma: "Renovación plataforma", gasto_manual: "Gasto",
  };

  return (
    <div>
      <SectionHeader title="Finanzas" sub="Caja del mes, movimientos, y cierres anteriores." onAdd={onAddExpense} addLabel="Nuevo gasto" />

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: 0 }}>Caja del mes actual</h3>
          <button style={{ ...btnPrimary, background: C.danger }} onClick={() => { setCloseModalOpen(true); setNewBaseInput("0"); }}>
            Cerrar mes
          </button>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
          <KPI label="Base de caja" value={fmtMoney(cashBase.amount)} />
          <KPI label="Ventas del mes" value={fmtMoney(ventasPeriodo)} color={C.accent2} />
          <KPI label="Gastos del mes" value={fmtMoney(gastosPeriodo)} color={C.warn} />
          <KPI label="Ganancia del mes" value={fmtMoney(gananciaPeriodo)} color={gananciaPeriodo >= 0 ? C.success : C.danger} />
          <KPI label="Caja actual" value={fmtMoney(cajaActual)} color={C.accent} />
        </div>
        {cashBase.setAt && <div style={{ fontSize: 12, color: C.muted }}>Base establecida el {fmtDate(cashBase.setAt.slice(0, 10))}</div>}

        {editingBase ? (
          <div style={{ display: "flex", gap: 8, marginTop: 12, maxWidth: 320 }}>
            <input type="number" style={{ ...inputStyle, marginTop: 0 }} value={baseInput} onChange={(e) => setBaseInput(e.target.value)} />
            <button style={btnPrimary} onClick={() => { onSetCashBase(baseInput); setEditingBase(false); }}>Guardar</button>
            <button style={btnGhost} onClick={() => setEditingBase(false)}>Cancelar</button>
          </div>
        ) : (
          <button style={{ ...btnGhost, marginTop: 12, padding: "6px 12px", fontSize: 12.5 }} onClick={() => { setBaseInput(String(cashBase.amount || 0)); setEditingBase(true); }}>
            Editar base de caja
          </button>
        )}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>Movimientos del mes</h3>
        {ledger.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>Aún no hay movimientos este mes.</div>}
        {ledger.length > 0 && (
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Monto</th></tr></thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>{fmtDateTime(l.timestamp)}</td>
                  <td>{typeLabels[l.type] || l.type}</td>
                  <td style={{ color: C.muted }}>{l.label}</td>
                  <td style={{ color: l.amount >= 0 ? C.accent2 : C.danger, fontWeight: 600 }}>
                    {l.amount >= 0 ? "+" : "-"}{fmtMoney(Math.abs(l.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {closures.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>Cierres anteriores</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {closures.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtDateTime(c.date)}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>
                    Ganancia {fmtMoney(c.ganancia)} · Caja final {fmtMoney(c.cajaFinal)}
                  </div>
                </div>
                <button style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }} onClick={() => generateClosurePdf(c)}>
                  Descargar PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>Costo mensual por plataforma (acumulado)</h3>
        {platforms.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>No hay plataformas registradas.</div>}
        {platforms.length > 0 && (
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>Plataforma</th><th>Costo mensual</th></tr></thead>
            <tbody>
              {platforms.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td>{fmtMoney(p.cost)}</td></tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>Gastos adicionales (acumulado)</h3>
        {expenses.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>No hay gastos adicionales registrados.</div>}
        {expenses.length > 0 && (
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtDate(e.date)}</td>
                  <td>{e.desc}</td>
                  <td>{fmtMoney(e.amount)}</td>
                  <td><button style={iconBtnStyle} onClick={() => onDeleteExpense(e.id)}><Trash2 size={14} color={C.danger} /></button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Cerrar mes">
        <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          Esto guarda el cierre en el Historial (con opción de descargar PDF), y reinicia los movimientos del mes a cero.
          <br /><br />
          <strong style={{ color: C.text }}>Ganancia de este periodo: {fmtMoney(gananciaPeriodo)}</strong><br />
          <strong style={{ color: C.text }}>Caja final: {fmtMoney(cajaActual)}</strong>
        </div>
        <Field label="¿Con cuánto dinero empiezas el nuevo mes? (nueva base de caja)">
          <input type="number" style={inputStyle} value={newBaseInput} onChange={(e) => setNewBaseInput(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            style={{ ...btnPrimary, background: C.danger }}
            onClick={() => { onCloseMonth(newBaseInput); setCloseModalOpen(false); }}
          >
            Confirmar cierre
          </button>
          <button style={btnGhost} onClick={() => setCloseModalOpen(false)}>Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ color: C.muted, fontSize: 14.5, padding: "20px 0" }}>{text}</div>;
}

function PlatformModal({ data, onClose, onSave }) {
  const [name, setName] = useState(""); const [custom, setCustom] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [expDate, setExpDate] = useState(todayISO()); const [cost, setCost] = useState("");
  const [capacity, setCapacity] = useState(5); const [extraEmails, setExtraEmails] = useState([]);
  const [newExtraEmail, setNewExtraEmail] = useState("");
  const [color, setColor] = useState(PLATFORM_PALETTE[0]);

  useEffect(() => {
    if (data) {
      const known = PLATFORM_PRESETS.includes(data.name);
      setName(data.id ? (known ? data.name : "Otro") : "");
      setCustom(data.id && !known ? data.name || "" : "");
      setEmail(data.email || ""); setPassword(data.password || "");
      setExpDate(data.expDate || todayISO()); setCost(data.cost ?? "");
      setCapacity(data.capacity ?? 5);
      setExtraEmails(data.extraEmails || []);
      setNewExtraEmail("");
      setColor(data.color || PLATFORM_PALETTE[Math.floor(Math.random() * PLATFORM_PALETTE.length)]);
    }
  }, [data]);

  if (!data) return null;
  const finalName = name === "Otro" ? custom : name;

  return (
    <Modal open={!!data} onClose={onClose} title={data.id ? "Editar plataforma" : "Nueva plataforma"}>
      <Field label="Plataforma">
        <select value={name} onChange={(e) => setName(e.target.value)}>
          <option value="">Selecciona...</option>
          {PLATFORM_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>
      {name === "Otro" && <Field label="Nombre personalizado"><input style={inputStyle} value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>}
      <Field label="Correo de la cuenta"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Contraseña de la cuenta"><input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <Field label="Fecha de vencimiento"><input type="date" style={inputStyle} value={expDate} onChange={(e) => setExpDate(e.target.value)} /></Field>
      <Field label="Costo mensual (a proveedor)"><input type="number" style={inputStyle} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
      <Field label="Capacidad de perfiles estándar"><input type="number" style={inputStyle} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>

      <Field label="Color identificador de esta plataforma">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4, maxWidth: 320 }}>
          {PLATFORM_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              style={{
                width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                border: color === c ? `2px solid ${C.text}` : "2px solid transparent",
                outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </Field>

      <Field label="Correos de perfiles extra (ej. Netflix — uno por cada cupo extra)">
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 8 }}>
          Se venden por aparte, pero su costo ya está incluido en el costo mensual de esta cuenta. Agrega un correo por cada cupo extra que tenga la plataforma.
        </div>
        {extraEmails.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {extraEmails.map((em, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ flex: 1, fontSize: 13.5, fontFamily: "JetBrains Mono, monospace" }}>{em}</span>
                <button
                  style={iconBtnStyle}
                  onClick={() => setExtraEmails(extraEmails.filter((_, idx) => idx !== i))}
                  title="Quitar"
                >
                  <Trash2 size={13} color={C.danger} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            style={{ ...inputStyle, marginTop: 0 }} value={newExtraEmail}
            placeholder="correoextra@ejemplo.com"
            onChange={(e) => setNewExtraEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newExtraEmail.trim()) {
                setExtraEmails([...extraEmails, newExtraEmail.trim()]);
                setNewExtraEmail("");
              }
            }}
          />
          <button
            style={{ ...btnGhost, padding: "9px 12px" }}
            onClick={() => {
              if (newExtraEmail.trim()) {
                setExtraEmails([...extraEmails, newExtraEmail.trim()]);
                setNewExtraEmail("");
              }
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            if (!finalName || !email) { alert("Nombre y correo son obligatorios."); return; }
            onSave({ ...data, name: finalName, email, password, expDate, cost: Number(cost) || 0, capacity: Number(capacity) || 5, extraEmails, color });
          }}
        >Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function ProfileModal({ data, platforms, resellers, profiles, onClose, onSave }) {
  const [platformId, setPlatformId] = useState(""); const [clientName, setClientName] = useState("");
  const [type, setType] = useState("standard");
  const [pin, setPin] = useState(""); const [extraSlotEmail, setExtraSlotEmail] = useState(""); const [clientPassword, setClientPassword] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [cutDate, setCutDate] = useState(addDays(todayISO(), 30)); const [price, setPrice] = useState("");
  const [resellerId, setResellerId] = useState("");

  useEffect(() => {
    if (data) {
      setPlatformId(data.platformId || ""); setClientName(data.clientName || "");
      setType(data.type || "standard");
      setPin(data.pin || ""); setExtraSlotEmail(data.extraSlotEmail || data.clientEmail || ""); setClientPassword(data.clientPassword || "");
      setStartDate(data.startDate || todayISO());
      setCutDate(data.cutDate || addDays(todayISO(), 30)); setPrice(data.price ?? "");
      setResellerId(data.resellerId || "");
    }
  }, [data]);

  if (!data) return null;

  const withFree = (platforms || []).map((p) => {
    const usedStd = (profiles || []).filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type !== "extra" && pr.id !== data.id).length;
    const extraEmails = p.extraEmails || [];
    const usedExtraEmails = (profiles || [])
      .filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type === "extra" && pr.id !== data.id)
      .map((pr) => pr.extraSlotEmail);
    const availableExtraEmails = extraEmails.filter((em) => !usedExtraEmails.includes(em));
    const cap = p.capacity || 5;
    return { ...p, freeStd: cap - usedStd, extraEmails, availableExtraEmails, freeExtra: availableExtraEmails.length };
  });

  const platformOptions = withFree.filter((p) => p.freeStd > 0 || p.freeExtra > 0 || p.id === data.platformId);
  const selected = withFree.find((p) => p.id === platformId);

  // Correos extra que se pueden elegir: los libres, más el que ya tenía este perfil (si se está editando)
  const selectableExtraEmails = selected
    ? [...selected.availableExtraEmails, ...(data.extraSlotEmail && !selected.availableExtraEmails.includes(data.extraSlotEmail) ? [data.extraSlotEmail] : [])]
    : [];

  // Cada plataforma puede aparecer como: 1 opción estándar, y/o una opción por cada correo extra disponible
  const comboOptions = [];
  platformOptions.forEach((p) => {
    const canStandard = p.freeStd > 0 || (data.id && data.type !== "extra" && data.platformId === p.id);
    if (canStandard) {
      comboOptions.push({ value: `${p.id}::standard::`, label: `${p.name} (${p.email}) — ${p.freeStd} cupo${p.freeStd === 1 ? "" : "s"} libre${p.freeStd === 1 ? "" : "s"}`, platformId: p.id, type: "standard", email: "" });
    }
    const extraEmailsToShow = p.availableExtraEmails.length > 0 ? p.availableExtraEmails : [];
    const currentIsThisPlatform = data.id && data.type === "extra" && data.platformId === p.id;
    const emailsForOptions = currentIsThisPlatform && data.extraSlotEmail && !extraEmailsToShow.includes(data.extraSlotEmail)
      ? [...extraEmailsToShow, data.extraSlotEmail]
      : extraEmailsToShow;
    emailsForOptions.forEach((em) => {
      comboOptions.push({ value: `${p.id}::extra::${em}`, label: `${p.name} Perfil Extra — ${em}`, platformId: p.id, type: "extra", email: em });
    });
  });
  const comboValue = platformId ? `${platformId}::${type}::${type === "extra" ? extraSlotEmail : ""}` : "";

  return (
    <Modal open={!!data} onClose={onClose} title={data.id ? "Editar perfil" : "Nuevo perfil"}>
      <Field label="Plataforma">
        <select
          value={comboValue}
          onChange={(e) => {
            const opt = comboOptions.find((o) => o.value === e.target.value);
            setPlatformId(opt ? opt.platformId : "");
            setType(opt ? opt.type : "standard");
            setExtraSlotEmail(opt ? opt.email : "");
          }}
        >
          <option value="">Selecciona...</option>
          {comboOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {comboOptions.length === 0 && (
          <div style={{ fontSize: 13, color: C.warn, marginTop: 6 }}>No hay plataformas con cupos libres. Agrega una nueva plataforma, correos extra, o amplía la capacidad de una existente.</div>
        )}
        {platformId && type === "standard" && (
          <div style={{ fontSize: 13, color: C.accent2, marginTop: 6 }}>
            Se agregará en el correo: <strong>{platforms.find((p) => p.id === platformId)?.email}</strong>
          </div>
        )}
        {platformId && type === "extra" && (
          <div style={{ fontSize: 13, color: C.accent2, marginTop: 6 }}>
            Este cliente queda en el correo extra: <strong>{extraSlotEmail}</strong>
          </div>
        )}
      </Field>

      <Field label="Nombre del cliente"><input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} /></Field>

      {type === "extra" ? (
        <Field label="Contraseña de ese correo extra"><input style={inputStyle} value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} /></Field>
      ) : (
        <Field label="PIN del cliente (4 dígitos)">
          <input
            style={inputStyle} value={pin} maxLength={4} inputMode="numeric"
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
          />
        </Field>
      )}

      <Field label="Fecha de inicio">
        <input type="date" style={inputStyle} value={startDate} onChange={(e) => { setStartDate(e.target.value); setCutDate(addDays(e.target.value, 30)); }} />
      </Field>
      <Field label="Fecha de corte (30 días, editable)"><input type="date" style={inputStyle} value={cutDate} onChange={(e) => setCutDate(e.target.value)} /></Field>
      <Field label="Precio de venta"><input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      <Field label="Revendedor">
        <select value={resellerId} onChange={(e) => setResellerId(e.target.value)}>
          <option value="">Directo (sin revendedor)</option>
          {resellers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            if (!platformId || !clientName) { alert("Plataforma y nombre del cliente son obligatorios."); return; }
            if (type === "standard" && pin && !/^\d{4}$/.test(pin)) { alert("El PIN debe tener exactamente 4 dígitos numéricos."); return; }
            if (type === "extra" && (!extraSlotEmail || !clientPassword)) { alert("Elige el correo extra y escribe su contraseña."); return; }
            onSave({
              ...data, platformId, clientName, type,
              pin: type === "standard" ? pin : "",
              extraSlotEmail: type === "extra" ? extraSlotEmail : "",
              clientEmail: type === "extra" ? extraSlotEmail : "",
              clientPassword: type === "extra" ? clientPassword : "",
              startDate, cutDate, price: Number(price) || 0, resellerId: resellerId || null,
            });
          }}
        >Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function DeliveryModal({ data, onClose, platformName, platformEmail, platformPassword }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const text = data.type === "extra"
    ? `Plataforma: ${platformName(data.platformId)} (perfil extra)\n` +
      `Correo: ${data.clientEmail}\n` +
      `Contraseña: ${data.clientPassword}\n` +
      `Vence: ${fmtDate(data.cutDate)}`
    : `Plataforma: ${platformName(data.platformId)}\n` +
      `Correo: ${platformEmail(data.platformId)}\n` +
      `Contraseña: ${platformPassword(data.platformId)}\n` +
      `Nombre: ${data.clientName}\n` +
      `PIN: ${data.pin || "----"}\n` +
      `Vence: ${fmtDate(data.cutDate)}`;
  return (
    <Modal open={!!data} onClose={onClose} title="Datos para entregar al cliente">
      <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
        {text}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copiado" : "Copiar todo"}
        </button>
        <button style={btnGhost} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

function ResellerModal({ data, onClose, onSave, platforms }) {
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  const [color, setColor] = useState(RESELLER_PALETTE[0]);
  const [platformCosts, setPlatformCosts] = useState({});
  useEffect(() => {
    if (data) {
      setName(data.name || ""); setContact(data.contact || "");
      setColor(data.color || RESELLER_PALETTE[Math.floor(Math.random() * RESELLER_PALETTE.length)]);
      setPlatformCosts(data.platformCosts || {});
    }
  }, [data]);
  if (!data) return null;
  const distinctPlatformNames = Array.from(new Set((platforms || []).map((p) => p.name))).sort();
  return (
    <Modal open={!!data} onClose={onClose} title={data.id ? "Editar revendedor" : "Nuevo revendedor"}>
      <Field label="Nombre"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Contacto (teléfono / telegram)"><input style={inputStyle} value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
      <Field label="Color identificador">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {RESELLER_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              style={{
                width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                border: color === c ? `2px solid ${C.text}` : "2px solid transparent",
                outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </Field>
      {distinctPlatformNames.length > 0 && (
        <Field label="Costo por perfil, por plataforma (lo que te paga este revendedor)">
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 8 }}>
            Si el revendedor tiene acceso a su panel, verá este valor como su costo por cada plataforma.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {distinctPlatformNames.map((pname) => (
              <div key={pname} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13.5 }}>{pname}</span>
                <input
                  type="number"
                  style={{ ...inputStyle, marginTop: 0, width: 100 }}
                  value={platformCosts[pname] ?? ""}
                  placeholder="0"
                  onChange={(e) => setPlatformCosts({ ...platformCosts, [pname]: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </Field>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button style={btnPrimary} onClick={() => { if (!name) { alert("El nombre es obligatorio."); return; } onSave({ ...data, name, contact, color, platformCosts }); }}>Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function ResellerAccessModal({ data, onClose, onSave }) {
  // data: { reseller, existingUser } | null
  const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  useEffect(() => {
    if (data) {
      setUsername(data.existingUser?.username || "");
      setPassword("");
    }
  }, [data]);
  if (!data) return null;
  const { reseller, existingUser } = data;
  return (
    <Modal open={!!data} onClose={onClose} title={`Acceso de ${reseller.name}`}>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
        Con este usuario y contraseña, {reseller.name} podrá entrar a su propio panel: ver disponibilidad, sus clientes y lo que vence pronto — sin ver las cuentas ni las finanzas del negocio.
      </div>
      <Field label="Usuario"><input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
      <Field label={existingUser ? "Nueva contraseña (déjalo vacío para no cambiarla)" : "Contraseña"}>
        <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            if (!username) { alert("El usuario es obligatorio."); return; }
            if (!existingUser && !password) { alert("La contraseña es obligatoria para un acceso nuevo."); return; }
            onSave({
              id: existingUser?.id,
              name: reseller.name,
              username,
              ...(password ? { password } : {}),
              role: "reseller",
              resellerId: reseller.id,
            });
          }}
        >Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function ExpenseModal({ data, onClose, onSave }) {
  const [date, setDate] = useState(todayISO()); const [desc, setDesc] = useState(""); const [amount, setAmount] = useState("");
  useEffect(() => { if (data) { setDate(todayISO()); setDesc(""); setAmount(""); } }, [data]);
  if (!data) return null;
  return (
    <Modal open={!!data} onClose={onClose} title="Nuevo gasto">
      <Field label="Fecha"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Descripción"><input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      <Field label="Monto"><input type="number" style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button style={btnPrimary} onClick={() => { if (!desc || !amount) { alert("Descripción y monto son obligatorios."); return; } onSave({ date, desc, amount: Number(amount) }); }}>Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

function AuthShell({ children, theme, onToggleTheme }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: 20, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        ::placeholder { color: #5A6773; }
      `}</style>
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"}
          style={{ position: "absolute", top: 18, right: 18, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, color: C.text, cursor: "pointer", display: "flex" }}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      )}
      <div style={{ width: "100%", maxWidth: 380, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <img src={LOGO_FULL} alt="Serviciocolven" style={{ width: "100%", maxWidth: 220, height: "auto" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function FirstRunSetup({ onCreate, theme, onToggleTheme }) {
  const [name, setName] = useState(""); const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  return (
    <AuthShell theme={theme} onToggleTheme={onToggleTheme}>
      <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 4px 0", color: C.text }}>Configura tu cuenta de dueño</h2>
      <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 18px 0" }}>Esta será la cuenta principal, con acceso a todo incluyendo finanzas.</p>
      <Field label="Tu nombre"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Usuario"><input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
      <Field label="Correo (para recuperar tu contraseña si la olvidas)"><input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" /></Field>
      <Field label="Contraseña"><input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <Field label="Confirmar contraseña"><input type="password" style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      <button
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 6 }}
        onClick={() => {
          if (!name || !username || !password || !email) { alert("Todos los campos son obligatorios."); return; }
          if (password !== confirm) { alert("Las contraseñas no coinciden."); return; }
          if (password.length < 4) { alert("Usa una contraseña de al menos 4 caracteres."); return; }
          onCreate({ name, username, email, password });
        }}
      >
        <Shield size={15} />Crear cuenta de dueño
      </button>
    </AuthShell>
  );
}

function LoginScreen({ users, onLogin, onResetOwner, theme, onToggleTheme }) {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");

  const owner = users.find((u) => u.role === "owner");
  const requiresKey = !!owner?.recoveryKey;

  if (confirmingReset) {
    return (
      <AuthShell theme={theme} onToggleTheme={onToggleTheme}>
        <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 10px 0", color: C.text }}>Reiniciar acceso</h2>
        <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, margin: "0 0 18px 0" }}>
          Esto borrará el usuario y contraseña del dueño y de todos los empleados, para que puedas configurarlos de nuevo.
          <br /><br />
          <strong style={{ color: C.text }}>Tus plataformas, clientes, revendedores y finanzas no se pierden.</strong>
        </p>
        {requiresKey && (
          <Field label="Clave de recuperación">
            <input style={inputStyle} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="SC-XXXX-XXXX-XXXX" />
          </Field>
        )}
        {keyError && <div style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{keyError}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ ...btnPrimary, flex: 1, justifyContent: "center", background: C.danger }}
            onClick={() => {
              if (requiresKey && keyInput.trim().toUpperCase() !== owner.recoveryKey.toUpperCase()) {
                setKeyError("Esa clave no coincide con la registrada.");
                return;
              }
              onResetOwner();
              setConfirmingReset(false);
            }}
          >
            Sí, reiniciar
          </button>
          <button style={{ ...btnGhost, flex: 1, justifyContent: "center" }} onClick={() => { setConfirmingReset(false); setKeyInput(""); setKeyError(""); }}>
            Cancelar
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell theme={theme} onToggleTheme={onToggleTheme}>
      <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 18px 0", color: C.text }}>Inicia sesión</h2>
      <Field label="Usuario"><input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
      <Field label="Contraseña">
        <input
          type="password" style={inputStyle} value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const u = users.find((x) => x.username === username && x.password === password);
              if (u) onLogin(u); else setError("Usuario o contraseña incorrectos.");
            }
          }}
        />
      </Field>
      {error && <div style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{error}</div>}
      <button
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 6 }}
        onClick={() => {
          const u = users.find((x) => x.username === username && x.password === password);
          if (u) onLogin(u); else setError("Usuario o contraseña incorrectos.");
        }}
      >
        <LogIn size={15} />Entrar
      </button>
      <button
        style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12.5, marginTop: 14, cursor: "pointer", width: "100%", textAlign: "center", textDecoration: "underline" }}
        onClick={() => setConfirmingReset(true)}
      >
        Olvidé el usuario o la contraseña
      </button>
    </AuthShell>
  );
}

function AdminsTab({ users, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const admins = users
    .filter((u) => u.role === "admin")
    .filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <SectionHeader title="Empleados" sub="Pueden gestionar plataformas, clientes y revendedores, pero no ven finanzas." onAdd={onAdd} addLabel="Nuevo empleado" />
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.muted }} />
        <input style={{ ...inputStyle, paddingLeft: 30, marginTop: 0 }} placeholder="Buscar empleado o usuario..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {admins.length === 0 && <EmptyState text="Aún no has agregado empleados, o ninguno coincide con la búsqueda." />}
      {admins.length > 0 && (
        <div style={{ overflowX: "auto" }}><table>
          <thead><tr><th>Nombre</th><th>Usuario</th><th></th></tr></thead>
          <tbody>
            {admins.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{u.username}</td>
                <td>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button style={iconBtnStyle} onClick={() => onEdit(u)}><Pencil size={14} /></button>
                    <button style={iconBtnStyle} onClick={() => onDelete(u.id)}><Trash2 size={14} color={C.danger} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

function SecurityTab({ currentUser, onGenerate, theme, onToggleTheme }) {
  const [key, setKey] = useState(currentUser.recoveryKey || null);
  const [copied, setCopied] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  return (
    <div>
      <SectionHeader title="Seguridad" sub="Clave de recuperación de tu cuenta de dueño, y preferencias de apariencia." />

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 18, maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <KeyRound size={17} color={C.accent} />
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15.5, fontWeight: 700, margin: 0 }}>Clave de recuperación</h3>
        </div>

        {!key ? (
          <div>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Esta clave es tu respaldo para poder reiniciar el acceso si algún día olvidas tu usuario o contraseña.
              Se muestra <strong style={{ color: C.text }}>una sola vez</strong> — guárdala en un lugar seguro (nota del celular, papel, etc.).
              Aún no has generado una.
            </p>
            <button style={btnPrimary} onClick={() => setKey(onGenerate())}>
              <KeyRound size={15} />Generar clave
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18,
              fontFamily: "JetBrains Mono, monospace", fontSize: 19, fontWeight: 700, letterSpacing: 1,
              textAlign: "center", marginBottom: 14, color: C.accent,
            }}>
              {key}
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Guarda esta clave en un lugar seguro. Te la pedirá el sistema si necesitas hacer un reinicio total de acceso.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                style={btnPrimary}
                onClick={() => {
                  navigator.clipboard?.writeText(key)
                    .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
                    .catch(() => alert("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente."));
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copiada" : "Copiar clave"}
              </button>
            </div>
            {!confirmingRegenerate ? (
              <button
                style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                onClick={() => setConfirmingRegenerate(true)}
              >
                Generar una clave nueva (esto invalida la anterior)
              </button>
            ) : (
              <div style={{ background: C.panel2, border: `1px solid ${C.danger}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12.5, color: C.text, marginBottom: 8 }}>¿Seguro? La clave anterior dejará de funcionar.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btnPrimary, background: C.danger, padding: "6px 12px", fontSize: 12.5 }} onClick={() => { setKey(onGenerate()); setConfirmingRegenerate(false); }}>Sí, generar nueva</button>
                  <button style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }} onClick={() => setConfirmingRegenerate(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {theme === "light" ? <Sun size={17} color={C.accent} /> : <Moon size={17} color={C.accent} />}
          <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15.5, fontWeight: 700, margin: 0 }}>Apariencia</h3>
        </div>
        <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          Tema actual: <strong style={{ color: C.text }}>{theme === "light" ? "Claro" : "Oscuro"}</strong>
        </p>
        <button style={btnGhost} onClick={onToggleTheme}>
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          Cambiar a {theme === "light" ? "oscuro" : "claro"}
        </button>
      </div>
    </div>
  );
}

function AdminModal({ data, users, onClose, onSave }) {
  const [name, setName] = useState(""); const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  useEffect(() => {
    if (data) { setName(data.name || ""); setUsername(data.username || ""); setPassword(""); }
  }, [data]);
  if (!data) return null;
  return (
    <Modal open={!!data} onClose={onClose} title={data.id ? "Editar empleado" : "Nuevo empleado"}>
      <Field label="Nombre"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Usuario"><input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
      <Field label={data.id ? "Nueva contraseña (déjalo vacío para no cambiarla)" : "Contraseña"}>
        <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            if (!name || !username) { alert("Nombre y usuario son obligatorios."); return; }
            if (!data.id && !password) { alert("La contraseña es obligatoria para un usuario nuevo."); return; }
            const dup = users.some((u) => u.username === username && u.id !== data.id);
            if (dup) { alert("Ese nombre de usuario ya existe."); return; }
            onSave({ ...data, name, username, ...(password ? { password } : {}) });
          }}
        >Guardar</button>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}


function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function HistoryTab({ logs }) {
  const [search, setSearch] = useState("");
  const filtered = logs.filter((l) =>
    l.userName?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    (l.detail || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <SectionHeader title="Historial" sub="Registro de todos los cambios realizados por el dueño y los empleados." />
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.muted }} />
        <input style={{ ...inputStyle, paddingLeft: 30, marginTop: 0 }} placeholder="Buscar por usuario, acción o detalle..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 && <EmptyState text="Aún no hay actividad registrada, o ninguna coincide con la búsqueda." />}
      {filtered.length > 0 && (
        <div style={{ overflowX: "auto" }}><table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td style={{ fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>{fmtDateTime(l.timestamp)}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{l.userName}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}> ({l.userRole === "owner" ? "dueño" : "admin"})</span>
                </td>
                <td>{l.action}</td>
                <td style={{ color: C.muted }}>{l.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

// ==================== Panel del Revendedor ====================
// Vista reducida para usuarios con role "reseller": no ven cuentas madre,
// finanzas, ni clientes de otros revendedores. Solo lo suyo, y solo para ver.
function ResellerPortal({ reseller, platforms, profiles, theme, onToggleTheme, onLogout, dollar }) {
  const [tab, setTab] = useState("availability");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 860 : false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [renewalProfile, setRenewalProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  const platformName = (id) => platforms.find((p) => p.id === id)?.name || "—";
  const platformEmail = (id) => platforms.find((p) => p.id === id)?.email || "—";
  const platformPassword = (id) => platforms.find((p) => p.id === id)?.password || "—";

  const myClients = profiles.filter((p) => p.resellerId === reseller.id);
  const dueSoon = myClients.filter((p) => !p.cancelled && daysUntil(p.cutDate) <= 3);

  // Disponibilidad agregada por nombre de plataforma, sin exponer cuentas ni credenciales
  const groups = {};
  platforms.forEach((p) => {
    const cap = p.capacity || 5;
    const extraCap = (p.extraEmails || []).length;
    const used = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type !== "extra").length;
    const usedExtra = profiles.filter((pr) => pr.platformId === p.id && !pr.cancelled && pr.type === "extra").length;
    if (!groups[p.name]) groups[p.name] = { name: p.name, total: 0, used: 0 };
    groups[p.name].total += cap + extraCap;
    groups[p.name].used += used + usedExtra;
  });
  const availabilityList = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));

  const navItems = [
    { key: "availability", label: "Disponibilidad", icon: PieChart },
    { key: "clients", label: "Mis clientes", icon: Users },
    { key: "due", label: "Por cobrar", icon: AlertTriangle },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #5A6773; }
      `}</style>

      {isMobile && mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(5,8,11,0.6)", zIndex: 45 }} />
      )}

      <div
        style={{
          width: 210, background: C.panel, borderRight: `1px solid ${C.border}`, padding: "22px 14px",
          display: "flex", flexDirection: "column", gap: 4, flexShrink: 0,
          ...(isMobile ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, transform: mobileNavOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.2s ease" } : {}),
        }}
      >
        <div style={{ padding: "0 8px 22px 8px", fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 16 }}>Serviciocolven</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setMobileNavOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
                background: active ? C.panel2 : "transparent", border: "none",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                color: active ? C.text : C.muted, cursor: "pointer", fontSize: 14.5, fontWeight: 600,
                textAlign: "left", fontFamily: "Inter, sans-serif",
              }}
            >
              <Icon size={16} />
              {item.label}
              {item.key === "due" && dueSoon.length > 0 && (
                <span style={{ marginLeft: "auto", background: C.danger, color: "#fff", fontSize: 11.5, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>
                  {dueSoon.length}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: reseller.color || C.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <UserCheck size={13} color={contrastText(reseller.color || C.panel2)} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reseller.name}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>Revendedor</div>
            </div>
            <button style={iconBtnStyle} title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"} onClick={onToggleTheme}>
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button style={iconBtnStyle} title="Cerrar sesión" onClick={onLogout}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: isMobile ? "16px 14px" : "28px 34px", overflowY: "auto", width: "100%", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <button onClick={() => setMobileNavOpen(true)} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, color: C.text, cursor: "pointer", display: "flex" }}>
              <Menu size={18} />
            </button>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 15 }}>Serviciocolven</div>
          </div>
        )}

        {dollar && <DollarRateBanner dollar={dollar} compact />}

        {tab === "availability" && (
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>Disponibilidad</h1>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 22px 0" }}>Cupos libres por plataforma y tu costo por perfil.</p>
            {availabilityList.length === 0 && <EmptyState text="Aún no hay plataformas cargadas." />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {availabilityList.map((g) => {
                const free = g.total - g.used;
                const cost = reseller.platformCosts?.[g.name];
                return (
                  <div key={g.name} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>{g.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 800, color: free > 0 ? C.accent2 : C.danger }}>{free}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>disponibles</span>
                    </div>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 13.5, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.muted }}>Tu costo por perfil</span>
                      <span style={{ fontWeight: 600 }}>{cost !== undefined ? fmtMoney(cost) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "clients" && (
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>Mis clientes</h1>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 22px 0" }}>Tus clientes asignados. Solo consulta.</p>
            {myClients.length === 0 && <EmptyState text="Aún no tienes clientes asignados." />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {myClients.map((p) => {
                const st = statusFor(p.cutDate, p.cancelled);
                return (
                  <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
                    <Ring days={st.days ?? 0} color={st.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <button
                        onClick={() => setViewingProfile(p)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.text, textDecoration: "underline", textDecorationColor: C.border, textUnderlineOffset: 3 }}
                      >
                        {p.clientName}
                      </button>
                      <div style={{ fontSize: 12.5, color: C.muted, margin: "4px 0 8px 0" }}>{platformName(p.platformId)}{p.type === "extra" ? " · Extra" : ""}</div>
                      <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Corte</span><span>{fmtDate(p.cutDate)}</span></div>
                      <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Estado</span><span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span></div>
                      <button style={{ ...btnGhost, padding: "6px 10px", fontSize: 12.5, marginTop: 8 }} onClick={() => setDeliveryProfile(p)}><Send size={12} />Ver mensaje de entrega</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "due" && (
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>Por cobrar</h1>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 22px 0" }}>Clientes vencidos o próximos a vencer.</p>
            {dueSoon.length === 0 && <div style={{ color: C.muted, fontSize: 14.5 }}>No tienes clientes por vencer en los próximos días.</div>}
            {dueSoon.length > 0 && (
              <div style={{ overflowX: "auto" }}><table>
                <thead><tr><th>Cliente</th><th>Plataforma</th><th>Corte</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {dueSoon.sort((a, b) => daysUntil(a.cutDate) - daysUntil(b.cutDate)).map((p) => {
                    const st = statusFor(p.cutDate, p.cancelled);
                    return (
                      <tr key={p.id}>
                        <td>{p.clientName}</td>
                        <td>{platformName(p.platformId)}</td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace" }}>{fmtDate(p.cutDate)}</td>
                        <td><span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span></td>
                        <td><button style={{ ...btnGhost, padding: "5px 10px", fontSize: 12.5 }} onClick={() => setRenewalProfile(p)}><Send size={12} />Ver aviso</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        )}
      </div>

      <ProfileDetailModal profile={viewingProfile} onClose={() => setViewingProfile(null)} platformName={platformName} platformEmail={platformEmail} resellerName={() => reseller.name} />
      <DeliveryModal data={deliveryProfile} onClose={() => setDeliveryProfile(null)} platformName={platformName} platformEmail={platformEmail} platformPassword={platformPassword} />
      <RenewalModal data={renewalProfile} onClose={() => setRenewalProfile(null)} />
    </div>
  );
}

// ==================== Exportar listas de correos ====================
// Agrupa los correos por plataforma, separando cuentas estándar de correos extra,
// para que el dueño pueda descargar exactamente lo que necesita (ej. "Netflix (Extra)").
function buildEmailCategories(platforms, profiles, resellerId) {
  const categories = {};
  platforms.forEach((p) => {
    // Cuenta estándar: solo se incluye si (sin filtro) o si el revendedor tiene al menos un cliente en esa cuenta.
    const includeStandard = !resellerId || profiles.some((pr) => pr.platformId === p.id && pr.type !== "extra" && pr.resellerId === resellerId);
    if (includeStandard) {
      if (!categories[p.name]) categories[p.name] = [];
      categories[p.name].push({ email: p.email, password: p.password });
    }
    if ((p.extraEmails || []).length > 0) {
      const extraKey = `${p.name} (Extra)`;
      p.extraEmails.forEach((em) => {
        const owner = profiles.find((pr) => pr.type === "extra" && pr.extraSlotEmail === em);
        const includeExtra = !resellerId || owner?.resellerId === resellerId;
        if (includeExtra) {
          if (!categories[extraKey]) categories[extraKey] = [];
          categories[extraKey].push({ email: em, password: owner?.clientPassword || "" });
        }
      });
    }
  });
  return categories;
}

function EmailExportModal({ open, onClose, platforms, profiles, resellers }) {
  const [selected, setSelected] = useState({});
  const [includePassword, setIncludePassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [resellerFilter, setResellerFilter] = useState("");

  useEffect(() => {
    if (open) {
      const cats = buildEmailCategories(platforms, profiles, resellerFilter || null);
      const initial = {};
      Object.keys(cats).forEach((k) => { initial[k] = false; });
      setSelected(initial);
      setIncludePassword(false);
      setShowPreview(false);
      setCopied(false);
      setResellerFilter("");
    }
  }, [open]);

  if (!open) return null;

  const categories = buildEmailCategories(platforms, profiles, resellerFilter || null);
  const categoryNames = Object.keys(categories).sort();
  const toggle = (name) => { setSelected((s) => ({ ...s, [name]: !s[name] })); setShowPreview(false); };
  const allSelected = categoryNames.length > 0 && categoryNames.every((n) => selected[n]);
  const toggleAll = () => {
    const next = {};
    categoryNames.forEach((n) => { next[n] = !allSelected; });
    setSelected(next);
    setShowPreview(false);
  };
  const selectedNames = categoryNames.filter((n) => selected[n]);

  const handleResellerChange = (value) => {
    setResellerFilter(value);
    const cats = buildEmailCategories(platforms, profiles, value || null);
    const initial = {};
    Object.keys(cats).forEach((k) => { initial[k] = false; });
    setSelected(initial);
    setShowPreview(false);
  };

  const buildText = () => {
    let text = "";
    selectedNames.forEach((name) => {
      text += `=== ${name} (${categories[name].length}) ===\n`;
      categories[name].forEach((item) => {
        text += includePassword ? `${item.email}\t${item.password || "—"}\n` : `${item.email}\n`;
      });
      text += "\n";
    });
    return text;
  };

  const handleShowReport = () => {
    if (selectedNames.length === 0) { alert("Selecciona al menos una lista."); return; }
    setShowPreview(true);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(buildText())
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => alert("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente (Ctrl+C)."));
  };

  const handleDownload = () => {
    if (selectedNames.length === 0) { alert("Selecciona al menos una lista."); return; }
    const blob = new Blob([buildText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `correos-${todayISO()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="Lista de correos" wide>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
        Elige qué listas quieres exportar. Las cuentas estándar y los correos extra de cada plataforma aparecen por separado.
      </div>
      {resellers && resellers.length > 0 && (
        <Field label="Revendedor (opcional — filtra solo los correos con clientes de ese revendedor)">
          <select value={resellerFilter} onChange={(e) => handleResellerChange(e.target.value)}>
            <option value="">Todos los correos</option>
            {resellers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
      )}
      {categoryNames.length === 0 && <EmptyState text={resellerFilter ? "Este revendedor no tiene clientes en ninguna cuenta." : "Aún no hay plataformas cargadas."} />}
      {categoryNames.length > 0 && (
        <>
          <button style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5, marginBottom: 10 }} onClick={toggleAll}>
            {allSelected ? "Quitar toda la selección" : "Seleccionar todo"}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", marginBottom: 14, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            {categoryNames.map((name) => (
              <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={!!selected[name]} onChange={() => toggle(name)} />
                {name} <span style={{ color: C.muted, fontSize: 12.5 }}>({categories[name].length})</span>
              </label>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", marginBottom: 18 }}>
            <input type="checkbox" checked={includePassword} onChange={(e) => { setIncludePassword(e.target.checked); setShowPreview(false); }} />
            Incluir contraseña
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: showPreview ? 14 : 0 }}>
            <button style={btnPrimary} onClick={handleShowReport}>
              Generar reporte {selectedNames.length > 0 ? `(${selectedNames.length})` : ""}
            </button>
            <button style={btnGhost} onClick={handleDownload}>
              <Download size={15} />Descargar .txt
            </button>
            <button style={btnGhost} onClick={onClose}>Cerrar</button>
          </div>
          {showPreview && (
            <div>
              <textarea
                readOnly
                value={buildText()}
                style={{
                  width: "100%", minHeight: 220, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: 14, color: C.text, fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.7, resize: "vertical",
                }}
                onFocus={(e) => e.target.select()}
              />
              <button style={{ ...btnPrimary, marginTop: 10 }} onClick={handleCopy}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copiado" : "Copiar todo"}
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
