import React, { useState, useEffect } from "react";

const Event = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    images: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    setLoading(true);
    fetch("http://localhost:3000/api/activities/events")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((ev) => ({
          ...ev,
          date: ev.start_date,
          time: ev.time,
          images: ev.images,
          location: ev.location,
          organizer: ev.organizer,
          description: ev.description,
        }));
        setEvents(mapped);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setForm((prev) => ({
        ...prev,
        images: Array.from(files),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.date ||
      !form.time ||
      !form.location.trim() ||
      !form.organizer.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", "event");
    formData.append("start_date", form.date);
    formData.append("time", form.time);
    formData.append("location", form.location);
    formData.append("organizer", form.organizer);
    for (const file of form.images) {
      formData.append("images", file);
    }
    try {
      const res = await fetch("http://localhost:3000/api/activities", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Event added successfully!");
        setForm({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          organizer: "",
          images: [],
        });
        e.target.reset();
        fetchEvents();
      } else {
        alert("Failed to add event.");
      }
    } catch (err) {
      alert("Error adding event.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/activities/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      } else {
        alert('Failed to delete event.');
      }
    } catch (err) {
      alert('Error deleting event.');
    }
  };

  // Categorize events from backend
  const now = new Date();
  const upcomingEvents = events.filter((event) => {
    const eventDateTime = new Date(event.date);
    return eventDateTime > now;
  });
  const pastEvents = events.filter((event) => {
    const eventDateTime = new Date(event.date);
    return eventDateTime <= now;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Events</h1>
      {/* Add Event Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow mb-10 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
            required
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Time</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Organizer</label>
            <input
              type="text"
              name="organizer"
              value={form.organizer}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Images (optional, you can select multiple)</label>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Add Event
        </button>
      </form>
      {/* Upcoming Events */}
      <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
      {loading ? (
        <div className="text-gray-500 mb-8">Loading...</div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-gray-500 mb-8">No upcoming events at the moment.</div>
      ) : (
        <EventSection data={upcomingEvents} onDelete={handleDelete} />
      )}
      {/* Past Events */}
      <h2 className="text-xl font-semibold mb-4 mt-10">Past Events</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : pastEvents.length === 0 ? (
        <div className="text-gray-500">No past events yet.</div>
      ) : (
        <EventSection data={pastEvents} faded onDelete={handleDelete} />
      )}
    </div>
  );
};

// Reusable Section Component
const EventSection = ({ data, faded, onDelete }) => {
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="mb-10">
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Title</th>
              <th className="p-3">Description</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Location</th>
              <th className="p-3">Organizer</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((event) => (
              <tr key={event.id} className={`bg-white hover:bg-gray-50${faded ? " opacity-70" : ""}`}>
                <td className="p-3">
                  {event.images && event.images.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {event.images.map((img, idx) => (
                        <img key={idx} src={`http://localhost:3000${img}`} alt="event" className="w-12 h-12 object-cover rounded" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No Images</span>
                  )}
                </td>
                <td className="p-3 font-semibold">{event.title}</td>
                <td className="p-3">{event.description}</td>
                <td className="p-3">{formatDate(event.date)}</td>
                <td className="p-3">{event.time}</td>
                <td className="p-3">{event.location}</td>
                <td className="p-3">{event.organizer}</td>
                <td className="p-3">
                  <button
                    onClick={() => onDelete(event.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Event;
