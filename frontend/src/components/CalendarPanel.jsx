import { useEffect, useState } from "react";
import { calendarApi } from "../services/calendar";

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [event, setEvent] = useState({ title: "", startTime: "", endTime: "" });
  const [reminder, setReminder] = useState({ title: "", remindAt: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([calendarApi.events(), calendarApi.reminders()])
      .then(([loadedEvents, loadedReminders]) => { setEvents(loadedEvents); setReminders(loadedReminders); })
      .catch((err) => setError(err.message));
  }, []);

  const addEvent = async (e) => {
    e.preventDefault();
    try {
      const created = await calendarApi.createEvent(event);
      setEvents((items) => [...items, created].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      setEvent({ title: "", startTime: "", endTime: "" });
    } catch (err) { setError(err.message); }
  };

  const addReminder = async (e) => {
    e.preventDefault();
    try {
      const created = await calendarApi.createReminder(reminder);
      setReminders((items) => [...items, created].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)));
      setReminder({ title: "", remindAt: "" });
    } catch (err) { setError(err.message); }
  };

  const toggleReminder = async (item) => {
    try {
      const updated = await calendarApi.completeReminder(item.id, !item.is_completed);
      setReminders((items) => items.map((current) => current.id === item.id ? updated : current));
    } catch (err) { setError(err.message); }
  };

  return <section className="calendar-panel">
    <h2>Calendar & Reminders</h2>
    {error && <p className="error">{error}</p>}
    <div className="calendar-grid">
      <div className="calendar-card">
        <h3>Add event</h3>
        <form onSubmit={addEvent}>
          <input placeholder="Event title" value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} required />
          <input type="datetime-local" value={event.startTime} onChange={(e) => setEvent({ ...event, startTime: e.target.value })} required />
          <input type="datetime-local" value={event.endTime} onChange={(e) => setEvent({ ...event, endTime: e.target.value })} />
          <button className="primary">Add event</button>
        </form>
        <div className="calendar-list">{events.map((item) => <article key={item.id}><strong>{item.title}</strong><span>{new Date(item.start_time).toLocaleString()}</span></article>)}</div>
      </div>
      <div className="calendar-card">
        <h3>Add reminder</h3>
        <form onSubmit={addReminder}>
          <input placeholder="Reminder title" value={reminder.title} onChange={(e) => setReminder({ ...reminder, title: e.target.value })} required />
          <input type="datetime-local" value={reminder.remindAt} onChange={(e) => setReminder({ ...reminder, remindAt: e.target.value })} required />
          <button className="primary">Set reminder</button>
        </form>
        <div className="calendar-list">{reminders.map((item) => <article key={item.id} className={item.is_completed ? "completed" : ""}><label><input type="checkbox" checked={item.is_completed} onChange={() => toggleReminder(item)} /><strong>{item.title}</strong></label><span>{new Date(item.remind_at).toLocaleString()}</span></article>)}</div>
      </div>
    </div>
  </section>;
}
