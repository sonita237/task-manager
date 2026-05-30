import { useState, useEffect, useCallback } from "react";
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, "0");

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sc)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const emailLog = [];
function sendReminderEmail(user, task) {
  const msg = {
    id: uid(),
    to: user.email,
    subject: `⏰ Reminder: "${task.title}" is due soon`,
    body: `Hi ${user.name}, your task "${task.title}" is due at ${formatDate(task.deadline)}.`,
    sentAt: new Date().toISOString(),
  };
  emailLog.unshift(msg);
  return msg;
}

const SEED_TASKS = [
  {
    id: uid(), title: "Design UI mockups", description: "Create wireframes for the dashboard.",
    priority: "high", status: "in-progress",
    deadline: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    reminderSent: false, createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Write unit tests", description: "Cover all auth endpoints.",
    priority: "medium", status: "todo",
    deadline: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    reminderSent: false, createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Deploy to staging", description: "Push latest build to staging server.",
    priority: "low", status: "done",
    deadline: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    reminderSent: true, createdAt: new Date().toISOString(),
  },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0a0a0f; --surface: #13131a; --surface2: #1c1c28; --border: #2a2a3d;
  --accent: #7c6af7; --accent2: #f06292; --accent3: #4dd0e1;
  --text: #e8e8f0; --muted: #6b6b8a; --success: #4caf7d; --warning: #f5a623; --danger: #f06292;
  --font: 'Syne', sans-serif; --mono: 'DM Mono', monospace; --radius: 12px; --shadow: 0 8px 32px rgba(0,0,0,0.4);
}
html, body, #root { height: 100%; }
body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.5; min-height: 100vh; }
.app { display: flex; min-height: 100vh; }
.sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 28px 0; position: sticky; top: 0; height: 100vh; }
.sidebar-logo { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.5px; padding: 0 24px 28px; color: var(--accent); }
.sidebar-logo span { color: var(--text); }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 24px; cursor: pointer; font-size: 0.88rem; font-weight: 600; letter-spacing: 0.3px; color: var(--muted); border-left: 3px solid transparent; transition: all 0.15s; }
.nav-item:hover { color: var(--text); background: var(--surface2); }
.nav-item.active { color: var(--accent); border-color: var(--accent); background: rgba(124,106,247,0.08); }
.nav-icon { font-size: 1.1rem; }
.sidebar-footer { margin-top: auto; padding: 20px 24px; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); }
.user-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; color: #fff; flex-shrink: 0; }
.user-name { font-weight: 600; font-size: 0.85rem; color: var(--text); }
.user-email { font-size: 0.75rem; color: var(--muted); }
.btn-logout { width: 100%; padding: 7px 0; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-family: var(--font); font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
.btn-logout:hover { border-color: var(--danger); color: var(--danger); }
.main { flex: 1; overflow-y: auto; }
.page { padding: 40px; max-width: 960px; }
.page-title { font-size: 1.9rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
.page-sub { color: var(--muted); font-size: 0.88rem; margin-bottom: 32px; }
.auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); background-image: radial-gradient(ellipse at 20% 50%, rgba(124,106,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(240,98,146,0.06) 0%, transparent 50%); }
.auth-card { width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px; box-shadow: var(--shadow); }
.auth-title { font-size: 2rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
.auth-sub { color: var(--muted); font-size: 0.88rem; margin-bottom: 28px; }
.auth-toggle { margin-top: 20px; text-align: center; font-size: 0.85rem; color: var(--muted); }
.auth-toggle a { color: var(--accent); cursor: pointer; font-weight: 600; }
.auth-error { background: rgba(240,98,146,0.1); border: 1px solid var(--danger); border-radius: 8px; padding: 10px 14px; color: var(--danger); font-size: 0.84rem; margin-bottom: 16px; }
.field { margin-bottom: 18px; }
.label { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.5px; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; }
.input, .select, .textarea { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: var(--font); font-size: 0.9rem; transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
.input:focus, .select:focus, .textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,106,247,0.15); }
.textarea { resize: vertical; min-height: 80px; }
.select { appearance: none; cursor: pointer; }
.btn { padding: 10px 20px; border-radius: 9px; border: none; cursor: pointer; font-family: var(--font); font-size: 0.88rem; font-weight: 700; letter-spacing: 0.3px; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #9381fa; transform: translateY(-1px); }
.btn-danger { background: rgba(240,98,146,0.15); color: var(--danger); border: 1px solid rgba(240,98,146,0.3); }
.btn-danger:hover { background: rgba(240,98,146,0.25); }
.btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
.btn-ghost:hover { color: var(--text); border-color: var(--accent); }
.btn-sm { padding: 6px 12px; font-size: 0.78rem; border-radius: 7px; }
.btn-full { width: 100%; justify-content: center; padding: 12px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.stat-num { font-size: 2rem; font-weight: 800; letter-spacing: -1px; }
.stat-label { font-size: 0.78rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; display: flex; align-items: flex-start; gap: 16px; transition: border-color 0.15s, transform 0.15s; position: relative; overflow: hidden; }
.task-card:hover { border-color: var(--accent); transform: translateX(2px); }
.task-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.task-card.prio-high::before { background: var(--danger); }
.task-card.prio-medium::before { background: var(--warning); }
.task-card.prio-low::before { background: var(--success); }
.task-card.status-done { opacity: 0.6; }
.task-card.status-done .task-title { text-decoration: line-through; }
.task-check { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; margin-top: 2px; border: 2px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; background: transparent; }
.task-check.checked { background: var(--success); border-color: var(--success); color: #fff; font-size: 0.7rem; }
.task-check:hover { border-color: var(--accent); }
.task-body { flex: 1; min-width: 0; }
.task-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
.task-desc { font-size: 0.82rem; color: var(--muted); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; }
.badge-high { background: rgba(240,98,146,0.15); color: var(--danger); }
.badge-medium { background: rgba(245,166,35,0.15); color: var(--warning); }
.badge-low { background: rgba(76,175,125,0.15); color: var(--success); }
.badge-todo { background: rgba(107,107,138,0.2); color: var(--muted); }
.badge-in-progress { background: rgba(77,208,225,0.15); color: var(--accent3); }
.badge-done { background: rgba(76,175,125,0.15); color: var(--success); }
.task-deadline { font-size: 0.78rem; color: var(--muted); font-family: var(--mono); }
.task-deadline.overdue { color: var(--danger); }
.task-deadline.soon { color: var(--warning); }
.task-actions { display: flex; gap: 6px; flex-shrink: 0; }
.countdown-chip { font-family: var(--mono); font-size: 0.75rem; font-weight: 500; padding: 2px 8px; border-radius: 6px; background: rgba(124,106,247,0.12); color: var(--accent); letter-spacing: 0.5px; }
.countdown-chip.overdue { background: rgba(240,98,146,0.12); color: var(--danger); }
.countdown-chip.urgent { background: rgba(245,166,35,0.12); color: var(--warning); animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; width: 480px; max-width: 100%; box-shadow: var(--shadow); animation: slideUp 0.2s ease; }
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
.modal-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 24px; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
.email-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 12px; }
.email-subject { font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; }
.email-meta { font-size: 0.78rem; color: var(--muted); font-family: var(--mono); }
.email-body { font-size: 0.83rem; color: var(--muted); margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
.countdown-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.countdown-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
.countdown-card.alarm-ringing { border-color: var(--danger); animation: ringPulse 0.8s infinite; }
@keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(240,98,146,0.4)} 50%{box-shadow:0 0 0 8px rgba(240,98,146,0)} }
.countdown-title { font-weight: 700; font-size: 0.95rem; }
.big-countdown { font-family: var(--mono); font-size: 2rem; font-weight: 500; letter-spacing: 2px; color: var(--accent); }
.big-countdown.overdue { color: var(--danger); }
.big-countdown.urgent { color: var(--warning); }
.alarm-badge { font-size: 0.78rem; font-weight: 700; color: var(--danger); animation: pulse 0.8s infinite; }
.empty { text-align: center; padding: 60px 20px; color: var(--muted); }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { font-size: 0.9rem; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

function StyleInject() { return <style>{CSS}</style>; }

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [users, setUsers] = useState([{ id: uid(), name: "Demo User", email: "demo@tasks.io", password: "demo123" }]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = () => {
    setError("");
    if (mode === "register") {
      if (!form.name || !form.email || !form.password) return setError("All fields required.");
      if (users.find((u) => u.email === form.email)) return setError("Email already registered.");
      const u = { id: uid(), name: form.name, email: form.email, password: form.password };
      setUsers((p) => [...p, u]);
      onLogin(u);
    } else {
      const u = users.find((u) => u.email === form.email && u.password === form.password);
      if (!u) return setError("Invalid email or password.");
      onLogin(u);
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div className="auth-sub">{mode === "login" ? "Sign in to your workspace" : "Start managing your tasks"}</div>
        {error && <div className="auth-error">{error}</div>}
        {mode === "register" && (
          <div className="field">
            <div className="label">Full Name</div>
            <input className="input" placeholder="Jane Smith" value={form.name} onChange={set("name")} />
          </div>
        )}
        <div className="field">
          <div className="label">Email</div>
          <input className="input" placeholder="you@email.com" value={form.email} onChange={set("email")} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="field">
          <div className="label">Password</div>
          <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {mode === "login" && (
          <div style={{ fontSize: "0.77rem", color: "var(--muted)", marginBottom: 16 }}>
            Demo: <code style={{ color: "var(--accent)" }}>demo@tasks.io</code> / <code style={{ color: "var(--accent)" }}>demo123</code>
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={submit}>{mode === "login" ? "Sign In" : "Create Account"}</button>
       <div className="auth-toggle">
  {mode === "login" ? (
    <>
      Don't have an account?{" "}
      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode("register");
          setError("");
        }}
      >
        Register
      </button>
    </>
  ) : (
    <>
      Already have an account?{" "}
      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode("login");
          setError("");
        }}
      >
        Login
      </button>
    </>
  )}
</div>
      </div>
    </div>
  );
}

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(task || { title: "", description: "", priority: "medium", status: "todo", deadline: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, id: form.id || uid(), reminderSent: form.reminderSent || false, createdAt: form.createdAt || new Date().toISOString() });
    onClose();
  };
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{task ? "Edit Task" : "New Task"}</div>
        <div className="field"><div className="label">Title *</div><input className="input" placeholder="Task title..." value={form.title} onChange={set("title")} /></div>
        <div className="field"><div className="label">Description</div><textarea className="textarea" placeholder="Optional details..." value={form.description} onChange={set("description")} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field"><div className="label">Priority</div>
            <select className="select" value={form.priority} onChange={set("priority")}>
              <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="field"><div className="label">Status</div>
            <select className="select" value={form.status} onChange={set("status")}>
              <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="field"><div className="label">Deadline</div>
          <input className="input" type="datetime-local" value={form.deadline ? form.deadline.slice(0, 16) : ""} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value ? new Date(e.target.value).toISOString() : "" }))} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Task</button>
        </div>
      </div>
    </div>
  );
}

function CountdownChip({ deadline }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - now;
  const cls = diff < 0 ? "overdue" : diff < 3600000 ? "urgent" : "";
  return <span className={`countdown-chip ${cls}`}>{diff < 0 ? "OVERDUE" : formatCountdown(diff)}</span>;
}

function TasksPage({ tasks, onAdd, onEdit, onDelete, onToggle }) {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = tasks.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter || t.priority === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  return (
    <div className="page">
      <div className="page-title">Tasks</div>
      <div className="page-sub">All your tasks in one place</div>
      <div className="toolbar">
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="🔍 Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ width: 150 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option><option value="todo">To Do</option><option value="in-progress">In Progress</option>
          <option value="done">Done</option><option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
        </select>
        <button className="btn btn-primary" onClick={() => setModal("new")}>+ New Task</button>
      </div>
      <div className="task-list">
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">No tasks found</div></div>
        ) : filtered.map((t) => {
          const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "done";
          return (
            <div key={t.id} className={`task-card prio-${t.priority} status-${t.status}`}>
              <div className={`task-check ${t.status === "done" ? "checked" : ""}`} onClick={() => onToggle(t.id)}>{t.status === "done" && "✓"}</div>
              <div className="task-body">
                <div className="task-title">{t.title}</div>
                {t.description && <div className="task-desc">{t.description}</div>}
                <div className="task-meta">
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  <span className={`badge badge-${t.status}`}>{t.status}</span>
                  {t.deadline && <span className={`task-deadline ${isOverdue ? "overdue" : ""}`}>📅 {formatDate(t.deadline)}</span>}
                  {t.deadline && t.status !== "done" && <CountdownChip deadline={t.deadline} />}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(t)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(t.id)}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      {(modal === "new" || (modal && typeof modal === "object")) && (
        <TaskModal task={modal === "new" ? null : modal} onSave={modal === "new" ? onAdd : onEdit} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function DashboardPage({ tasks, user }) {
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
  const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return (
    <div className="page">
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Welcome back, {user.name} 👋</div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--muted)" }}>{todo}</div><div className="stat-label">To Do</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--accent3)" }}>{inProgress}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--success)" }}>{done}</div><div className="stat-label">Completed</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--danger)" }}>{overdue}</div><div className="stat-label">Overdue</div></div>
      </div>
      <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Recent Tasks</div>
      <div className="task-list">
        {recent.map((t) => (
          <div key={t.id} className={`task-card prio-${t.priority} status-${t.status}`}>
            <div className="task-body">
              <div className="task-title">{t.title}</div>
              <div className="task-meta">
                <span className={`badge badge-${t.status}`}>{t.status}</span>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                {t.deadline && <span className="task-deadline">📅 {formatDate(t.deadline)}</span>}
              </div>
            </div>
          </div>
        ))}
        {recent.length === 0 && <div className="empty"><div className="empty-icon">🌱</div><div className="empty-text">No tasks yet. Create your first one!</div></div>}
      </div>
    </div>
  );
}

function EmailPage({ tasks, user, emails, onSendReminder }) {
  const upcoming = tasks.filter((t) => t.deadline && t.status !== "done" && new Date(t.deadline) > new Date());
  return (
    <div className="page">
      <div className="page-title">Email Reminders</div>
      <div className="page-sub">Manage and simulate reminder emails for your tasks</div>
      <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Upcoming Tasks</div>
      <div className="task-list" style={{ marginBottom: 32 }}>
        {upcoming.length === 0 && <div className="empty"><div className="empty-icon">📬</div><div className="empty-text">No upcoming tasks with deadlines</div></div>}
        {upcoming.map((t) => (
          <div key={t.id} className={`task-card prio-${t.priority}`}>
            <div className="task-body">
              <div className="task-title">{t.title}</div>
              <div className="task-meta">
                <span className="task-deadline">📅 {formatDate(t.deadline)}</span>
                <CountdownChip deadline={t.deadline} />
                {t.reminderSent && <span className="badge badge-done">✉️ Sent</span>}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onSendReminder(t)}>Send Reminder</button>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Email Log ({emails.length})</div>
      {emails.length === 0 && <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">No emails sent yet</div></div>}
      {emails.map((e) => (
        <div key={e.id} className="email-card">
          <div className="email-subject">{e.subject}</div>
          <div className="email-meta">To: {e.to} &nbsp;·&nbsp; {formatDate(e.sentAt)}</div>
          <div className="email-body">{e.body}</div>
        </div>
      ))}
    </div>
  );
}

function CountdownPage({ tasks }) {
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState({});
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const active = tasks.filter((t) => t.deadline && t.status !== "done");
  return (
    <div className="page">
      <div className="page-title">Countdown & Alarms</div>
      <div className="page-sub">Real-time timers for all pending tasks</div>
      <div className="countdown-grid">
        {active.length === 0 && <div className="empty"><div className="empty-icon">⏱</div><div className="empty-text">No active tasks with deadlines</div></div>}
        {active.map((t) => {
          const diff = new Date(t.deadline).getTime() - now;
          const overdue = diff < 0;
          const urgent = !overdue && diff < 3600000;
          const ringing = overdue && !dismissed[t.id];
          return (
            <div key={t.id} className={`countdown-card ${ringing ? "alarm-ringing" : ""}`}>
              <div className="countdown-title">{t.title}</div>
              <div className={`big-countdown ${overdue ? "overdue" : urgent ? "urgent" : ""}`}>{overdue ? "-" + formatCountdown(-diff) : formatCountdown(diff)}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Due: {formatDate(t.deadline)}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                {overdue && !dismissed[t.id] && <span className="alarm-badge">🔔 ALARM!</span>}
                {urgent && !overdue && <span style={{ fontSize: "0.78rem", color: "var(--warning)" }}>⚠️ Due soon</span>}
              </div>
              {ringing && <button className="btn btn-ghost btn-sm" onClick={() => setDismissed((d) => ({ ...d, [t.id]: true }))}>Dismiss Alarm</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NAV = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "tasks", icon: "✅", label: "Tasks" },
  { key: "email", icon: "✉️", label: "Email Reminders" },
  { key: "countdown", icon: "⏱", label: "Countdown" },
];

function Sidebar({ page, onNav, user, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">Task<span>Flow</span></div>
      {NAV.map((n) => (
        <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => onNav(n.key)}>
          <span className="nav-icon">{n.icon}</span>{n.label}
        </div>
      ))}
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="avatar">{user.name[0].toUpperCase()}</div>
          <div><div className="user-name">{user.name}</div><div className="user-email">{user.email}</div></div>
        </div>
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function useAutoReminders(tasks, user, setTasks, addEmail) {
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setTasks((prev) => prev.map((t) => {
        if (!t.reminderSent && t.deadline && t.status !== "done") {
          const diff = new Date(t.deadline).getTime() - now;
          if (diff > 0 && diff < 3600000) {
            const email = sendReminderEmail(user, t);
            addEmail(email);
            return { ...t, reminderSent: true };
          }
        }
        return t;
      }));
    }, 10000);
    return () => clearInterval(id);
  }, [user, setTasks, addEmail]);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [emails, setEmails] = useState([]);
  const addEmail = useCallback((e) => setEmails((p) => [e, ...p]), []);
  useAutoReminders(tasks, user, setTasks, addEmail);
  const addTask = (t) => setTasks((p) => [t, ...p]);
  const editTask = (t) => setTasks((p) => p.map((x) => (x.id === t.id ? t : x)));
  const deleteTask = (id) => setTasks((p) => p.filter((x) => x.id !== id));
  const toggleTask = (id) => setTasks((p) => p.map((x) => x.id === id ? { ...x, status: x.status === "done" ? "todo" : "done" } : x));
  const sendReminder = (task) => {
    if (!user) return;
    const email = sendReminderEmail(user, task);
    addEmail(email);
    setTasks((p) => p.map((t) => t.id === task.id ? { ...t, reminderSent: true } : t));
  };
  if (!user) return <><StyleInject /><AuthPage onLogin={setUser} /></>;
  return (
    <>
      <StyleInject />
      <div className="app">
        <Sidebar page={page} onNav={setPage} user={user} onLogout={() => setUser(null)} />
        <div className="main">
          {page === "dashboard" && <DashboardPage tasks={tasks} user={user} />}
          {page === "tasks" && <TasksPage tasks={tasks} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} onToggle={toggleTask} />}
          {page === "email" && <EmailPage tasks={tasks} user={user} emails={emails} onSendReminder={sendReminder} />}
          {page === "countdown" && <CountdownPage tasks={tasks} />}
        </div>
      </div>
    </>
  );
}
