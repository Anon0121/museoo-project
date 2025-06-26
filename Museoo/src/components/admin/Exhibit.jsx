import React, { useState, useEffect } from "react";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const Exhibit = () => {
  const [exhibits, setExhibits] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    images: [],
    startDate: "",
    endDate: "",
    location: "",
    curator: "",
    category: "",
  });
  const [modalExhibit, setModalExhibit] = useState(null);

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

  const fetchExhibits = () => {
    fetch('http://localhost:3000/api/activities/exhibits')
      .then(res => res.json())
      .then(data => {
        // Map snake_case to camelCase
        const mapped = data.map(ex => ({
          ...ex,
          startDate: ex.start_date,
          endDate: ex.end_date,
          images: ex.images,
          location: ex.location,
          curator: ex.curator,
          category: ex.category,
          // Optionally remove snake_case fields if you want
        }));
        setExhibits(mapped);
      })
      .catch(() => setExhibits([]));
  };

  useEffect(() => {
    fetchExhibits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.location.trim() ||
      !form.curator.trim() ||
      !form.category.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    // 1. Build FormData
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('type', 'exhibit');
    formData.append('start_date', form.startDate);
    formData.append('end_date', form.endDate);
    formData.append('location', form.location);
    formData.append('curator', form.curator);
    formData.append('category', form.category);
    for (const file of form.images) {
      formData.append('images', file);
    }

    // 2. Send to backend
    try {
      const res = await fetch('http://localhost:3000/api/activities', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert('Exhibit added successfully!');
        setForm({
          title: "",
          description: "",
          images: [],
          startDate: "",
          endDate: "",
          location: "",
          curator: "",
          category: "",
        });
        e.target.reset();
        fetchExhibits();
      } else {
        alert('Failed to add exhibit.');
      }
    } catch (err) {
      alert('Error adding exhibit.');
    }
  };

  const handleDelete = (id) => {
    setExhibits(exhibits.filter((item) => item.id !== id));
  };

  // Categorize exhibits
  const now = new Date();
  const upcoming = exhibits.filter(
    (ex) => new Date(ex.startDate) > now
  );
  const ongoing = exhibits.filter(
    (ex) =>
      new Date(ex.startDate) <= now && new Date(ex.endDate) >= now
  );
  const history = exhibits.filter(
    (ex) => new Date(ex.endDate) < now
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Exhibits</h1>

      {/* Add Exhibit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 mb-10 space-y-4"
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
            <label className="block font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
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
            <label className="block font-medium mb-1">Curator</label>
            <input
              type="text"
              name="curator"
              value={form.curator}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
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
          Add Exhibit
        </button>
      </form>

      {/* Render Section */}
      <Section title="Upcoming Exhibits" data={upcoming} onDelete={handleDelete} onView={setModalExhibit} />
      <Section title="Ongoing Exhibits" data={ongoing} onDelete={handleDelete} onView={setModalExhibit} />
      <Section title="Exhibit History" data={history} onDelete={handleDelete} onView={setModalExhibit} hideDelete />

      {/* Modal for viewing details */}
      {modalExhibit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setModalExhibit(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">{modalExhibit.title}</h2>
            {modalExhibit.images && modalExhibit.images.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {modalExhibit.images.map((img, idx) => (
                  <img key={idx} src={`http://localhost:3000${img}`} alt="exhibit" className="w-24 h-24 object-cover rounded" />
                ))}
              </div>
            )}
            <div className="mb-2"><strong>Description:</strong> {modalExhibit.description}</div>
            <div className="mb-2"><strong>Location:</strong> {modalExhibit.location}</div>
            <div className="mb-2"><strong>Curator:</strong> {modalExhibit.curator}</div>
            <div className="mb-2"><strong>Category:</strong> {modalExhibit.category}</div>
            <div className="mb-2"><strong>Start Date:</strong> {formatDate(modalExhibit.startDate)}</div>
            <div className="mb-2"><strong>End Date:</strong> {formatDate(modalExhibit.endDate)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component to reuse table display
const Section = ({ title, data, onDelete, onView, hideDelete = false }) => {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No exhibits in this category.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Title</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                {!hideDelete && <th className="p-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3">
                    {item.images && item.images.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {item.images.map((img, idx) => (
                          <img key={idx} src={`http://localhost:3000${img}`} alt="exhibit" className="w-12 h-12 object-cover rounded" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No Images</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{item.title}</td>
                  <td className="p-3">{formatDate(item.startDate)}</td>
                  <td className="p-3">{formatDate(item.endDate)}</td>
                  {!hideDelete && (
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => onView(item)}
                        className="text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Exhibit;
