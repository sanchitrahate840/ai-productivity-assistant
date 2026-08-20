import { useEffect, useMemo, useState } from "react";
import { authApi, apiRequest } from "./services/api";
import { taskApi } from "./services/tasks";
import Notes from "./components/Notes";
import CalendarPanel from "./components/CalendarPanel";

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [section, setSection] = useState("overview");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    authApi.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    taskApi.list().then(setTasks).catch((error) => setMessage(error.message));
  }, [user]);

  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      const data = mode === "login" ? await authApi.login(form) : await authApi.register(form);
      localStorage.setItem("token", data.token); setUser(data.user);
    } catch (error) { setMessage(error.message); }
  };

  const addTask = async (event) => {
    event.preventDefault(); if (!newTask.title.trim()) return;
    try {
      const task = await taskApi.create(newTask);
      setTasks((current) => [task, ...current]);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
    } catch (error) { setMessage(error.message); }
  };

  const toggleTask = async (task) => {
    try {
      const updated = await taskApi.update(task.id, { status: task.status === "completed" ? "pending" : "completed" });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (error) { setMessage(error.message); }
  };

  const deleteTask = async (id) => {
    try { await taskApi.remove(id); setTasks((current) => current.filter((task) => task.id !== id)); }
    catch (error) { setMessage(error.message); }
  };

  const filteredTasks = useMemo(() => tasks.filter((task) => filter === "pending" ? task.status !== "completed" : filter === "completed" ? task.status === "completed" : filter === "high" ? task.priority === "high" : true), [tasks, filter]);
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.length - completedTasks;
  const highPriorityTasks = tasks.filter((task) => task.priority === "high" && task.status !== "completed").length;

  const sendChat = async (event) => {
    event?.preventDefault(); if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim(); setChatInput(""); setChat((items) => [...items, { role: "user", content: message }]); setChatLoading(true);
    try {
      const data = await apiRequest("/ai/chat", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ message, history: chat.slice(-8) }) });
      setChat((items) => [...items, { role: "assistant", content: data.reply }]);
    } catch (error) { setChat((items) => [...items, { role: "assistant", content: error.message }]); }
    finally { setChatLoading(false); }
  };

  const logout = () => { localStorage.removeItem("token"); setUser(null); setTasks([]); setChat([]); };

  if (loading) return <main className="app"><section className="auth-card"><p className="eyebrow">AI PRODUCTIVITY ASSISTANT</p><h1>Loading workspace…</h1></section></main>;

  if (!user) return (
    <main className="app"><section className="auth-card">
      <p className="eyebrow">AI PRODUCTIVITY ASSISTANT</p>
      <h1>{mode === "login" ? "Welcome back." : "Create your workspace."}</h1>
      <p className="subtitle">Tasks, notes, calendar and an AI assistant in one private workspace.</p>
      <form onSubmit={submit}>
        {mode === "register" && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {message && <p className="error">{message}</p>}
        <button className="primary" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <button className="link-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}</button>
    </section></main>
  );

  return <main className="app"><section className="dashboard">
    <header className="dashboard-header">
      <div><p className="eyebrow">MY WORKSPACE</p><h1>Hello, {user.name}</h1><p className="subtitle">Plan, remember and execute your day.</p></div>
      <button className="secondary" onClick={logout}>Log out</button>
    </header>

    <nav className="workspace-nav">
      {["overview", "notes", "calendar", "ai"].map((item) => <button key={item} className={section === item ? "primary" : "secondary"} onClick={() => setSection(item)}>{item === "overview" ? "Dashboard" : item === "ai" ? "AI Assistant" : item[0].toUpperCase() + item.slice(1)}</button>)}
    </nav>

    {section === "overview" && <>
      <section className="stats-grid">
        <div className="stat-card"><span>Total Tasks</span><strong>{tasks.length}</strong></div>
        <div className="stat-card"><span>Pending</span><strong>{pendingTasks}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{completedTasks}</strong></div>
        <div className="stat-card"><span>High Priority</span><strong>{highPriorityTasks}</strong></div>
      </section>
      <section className="task-panel">
        <div className="section-heading"><div><p className="eyebrow">ACTION LIST</p><h2>Tasks</h2></div></div>
        <form className="task-form" onSubmit={addTask}>
          <input placeholder="What needs to be done?" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
          <textarea placeholder="Description (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          <input type="datetime-local" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
          <button className="primary" type="submit">Add task</button>
        </form>
        {message && <p className="error">{message}</p>}
        <div className="task-filters">{[["all","All"],["pending","Pending"],["completed","Completed"],["high","High Priority"]].map(([value,label]) => <button key={value} className={filter === value ? "primary" : "secondary"} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="tasks">{filteredTasks.length === 0 ? <p className="empty">No tasks found.</p> : filteredTasks.map((task) => <article className={`task-card ${task.status === "completed" ? "completed" : ""}`} key={task.id}><input type="checkbox" checked={task.status === "completed"} onChange={() => toggleTask(task)} /><div className="task-content"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<span>{task.priority} priority{task.due_date ? ` • ${new Date(task.due_date).toLocaleString()}` : ""}</span></div><button className="delete" onClick={() => deleteTask(task.id)}>Delete</button></article>)}</div>
      </section>
    </>}

    {section === "notes" && <Notes />}
    {section === "calendar" && <CalendarPanel />}
    {section === "ai" && <section className="ai-panel"><div className="section-heading"><div><p className="eyebrow">INTELLIGENCE</p><h2>AI Assistant</h2><p className="subtitle">Ask about your tasks and notes, or ask for a practical plan.</p></div></div><div className="chat-window">{chat.length === 0 && <div className="empty">Try: “What should I focus on today?”</div>}{chat.map((item, index) => <div key={index} className={`chat-message ${item.role}`}><strong>{item.role === "user" ? "You" : "Assistant"}</strong><p>{item.content}</p></div>)}{chatLoading && <div className="chat-message assistant"><strong>Assistant</strong><p>Thinking…</p></div>}</div><form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask your productivity assistant…" /><button className="primary" type="submit">Send</button></form></section>}
  </section></main>;
}

export default App;
