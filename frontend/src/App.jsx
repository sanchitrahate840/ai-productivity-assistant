import { useState } from "react";
import { authApi } from "./services/api";

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const data = mode === "login" ? await authApi.login(form) : await authApi.register(form);
      localStorage.setItem("token", data.token);
      setUser(data.user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (user) {
    return (
      <main className="app">
        <section className="hero">
          <p className="eyebrow">DASHBOARD</p>
          <h1>Welcome, {user.name}.</h1>
          <p className="subtitle">Your authenticated productivity workspace is ready.</p>
          <button className="primary" onClick={() => { localStorage.removeItem("token"); setUser(null); }}>Log out</button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="hero auth-card">
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
      </section>
    </main>
  );
}

export default App;
