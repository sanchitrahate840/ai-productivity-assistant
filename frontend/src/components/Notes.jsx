import { useEffect, useState } from "react";
import { noteApi } from "../services/notes";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });
  const [message, setMessage] = useState("");

  const loadNotes = async (value = search) => {
    try { setNotes(await noteApi.list(value)); } catch (error) { setMessage(error.message); }
  };

  useEffect(() => { loadNotes(""); }, []);

  const createNote = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      const note = await noteApi.create({ ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      setNotes((current) => [note, ...current]);
      setForm({ title: "", content: "", category: "general", tags: "" });
    } catch (error) { setMessage(error.message); }
  };

  const togglePin = async (note) => {
    try {
      const updated = await noteApi.update(note.id, { isPinned: !note.is_pinned });
      setNotes((current) => current.map((item) => item.id === note.id ? updated : item));
    } catch (error) { setMessage(error.message); }
  };

  const remove = async (id) => {
    try { await noteApi.remove(id); setNotes((current) => current.filter((note) => note.id !== id)); }
    catch (error) { setMessage(error.message); }
  };

  return <section className="notes-panel">
    <div className="notes-heading"><div><p className="eyebrow">KNOWLEDGE</p><h2>Notes</h2></div><input className="note-search" placeholder="Search notes..." value={search} onChange={(e) => { setSearch(e.target.value); loadNotes(e.target.value); }} /></div>
    <form className="note-form" onSubmit={createNote}>
      <input placeholder="Note title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <textarea placeholder="Write your note..." rows="4" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      <div className="note-fields"><input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><input placeholder="Tags: study, project" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /><button className="primary" type="submit">Add note</button></div>
    </form>
    {message && <p className="error">{message}</p>}
    <div className="notes-grid">{notes.length === 0 ? <p className="empty">No notes found.</p> : notes.map((note) => <article className="note-card" key={note.id}>
      <div className="note-card-header"><h3>{note.title}</h3><button className="icon-button" onClick={() => togglePin(note)}>{note.is_pinned ? "📌" : "☆"}</button></div>
      <p>{note.content || "Empty note"}</p><small>{note.category}{note.tags?.length ? ` • ${note.tags.join(", ")}` : ""}</small>
      <button className="delete" onClick={() => remove(note.id)}>Delete</button>
    </article>)}</div>
  </section>;
}
