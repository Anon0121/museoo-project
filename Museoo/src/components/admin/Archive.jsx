import React, { useState } from "react";

const Archive = () => {
  const [archives, setArchives] = useState([]);
  const [form, setForm] = useState({
    title: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.file || form.file.type !== "application/pdf") {
      alert("Please enter a title and upload a valid PDF.");
      return;
    }

    const newArchive = {
      id: Date.now(),
      title: form.title,
      file: URL.createObjectURL(form.file),
    };

    setArchives([newArchive, ...archives]);
    setForm({ title: "", file: null });
    e.target.reset();
  };

  const handleDelete = (id) => {
    setArchives((prev) => prev.filter((doc) => doc.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Digital Archives</h1>

      {/* Upload Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow mb-10 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Document Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter PDF title"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Upload PDF</label>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
          Upload Document
        </button>
      </form>

      {/* Archives List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Uploaded PDFs</h2>
        {archives.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-4">
            {archives.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between border p-4 rounded"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-gray-500">PDF Document</p>
                </div>
                <div className="flex gap-4">
                  <a
                    href={doc.file}
                    download={doc.title + ".pdf"}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Archive;
