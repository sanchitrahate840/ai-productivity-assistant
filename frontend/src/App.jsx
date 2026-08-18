import { useEffect, useState } from "react";
import { authApi } from "./services/api";
import { taskApi } from "./services/tasks";

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", dueDate: "" });

  useEffect(() => {
    if (user) taskApi.list().then(setTasks).catch((error) => setMessage(error.message));
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const data = mode === "login" ? await authApi.login(form) : await authApi.register(form);
      localStorage.setItem("token", data.token);
      setUser(data.user);
    } catch (error) { setMessage(error.message); }
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const task = await taskApi.create(newTask);
      setTasks((current) => [task, ...current]);
      setNewTask({ title: "", priority: "medium", dueDate: "" });
    } catch (error) { setMessage(error.message); }
  };

  const toggleTask = async (task) => {
    try {
      const updated = await taskApi.update(task.id, { status: task.status === "completed" ? "pending" : "completed" });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (error) { setMessage(error.message); }
  };

  const deleteTask = async (id) => {
    try {
      await taskApi.remove(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) { setMessage(error.message); }
  };

  if (!user) return (
    <main className="app"><section className="hero auth-card">
      <p className="eyebrow">AI PRODUCTIVITY ASSISTANT</p>
      <h1>{mode === "login" ? "Welcome back." : "Create your workspace."}</h1>
      <p className="subtitle">Secure authentication is the first building block of your intelligent workspace.</p>
      <form onSubmit={submit}>
        {mode === "register" && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        {message && <p className="error">{message}</p>}
        <button className="primary" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <button className="link-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </section></main>
  );

  return (
    <main className="app"><section className="dashboard">
      <header className="dashboard-header"><div><p className="eyebrow">MY WORKSPACE</p><h1>Hello, {user.name}</h1></div><button className="secondary" onClick={() => { localStorage.removeItem("token"); setUser(null); setTasks([]); }}>Log out</button></header>
      <section className="task-panel">
        <h2>Tasks</h2>
        <form className="task-form" onSubmit={addTask}>
          <input placeholder="What needs to be done?" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          <input type="datetime-local" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
          <button className="primary" type="submit">Add task</button>
        </form>
        {message && <p className="error">{message}</p>}
        <div className="tasks">{tasks.length === 0 ? <p className="empty">No tasks yet. Add your first task above.</p> : tasks.map((task) => (
          <article className={`task-card ${task.status === "completed" ? "completed" : ""}`} key={task.id}>
            <input type="checkbox" checked={task.status === "completed"} onChange={() => toggleTask(task)} />
            <div className="task-content"><strong>{task.title}</strong><span>{task.priority} priority {task.due_date ? `• ${new Date(task.due_date).toLocaleString()}` : ""}</span></div>
            <button className="delete" onClick={() => deleteTask(task.id)}>Delete</button>
          </article>
        ))}</div>
      </section>
    </section></main>
  );
}

export default App;
