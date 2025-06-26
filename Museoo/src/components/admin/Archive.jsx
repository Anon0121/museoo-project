import React, { useState, useEffect } from 'react';

const FILE_TYPES = [
  { label: 'Document', value: 'Document' },
  { label: 'Image', value: 'Image' },
  { label: 'Audio', value: 'Audio' },
  { label: 'Video', value: 'Video' },
  { label: 'Other', value: 'Other' },
];

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const Archive = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Document',
    tags: '',
    file: null,
  });
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [preview, setPreview] = useState(null);

  // Fetch archives from backend
  useEffect(() => {
    fetch('http://localhost:3000/api/archives')
      .then(res => res.json())
      .then(setArchives);
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Handle upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.file) {
      alert('Title and file are required.');
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'file') formData.append('file', v);
      else formData.append(k, v);
    });
    const res = await fetch('http://localhost:3000/api/archives', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      setForm({ title: '', description: '', date: '', type: 'Document', tags: '', file: null });
      document.getElementById('archive-upload-form').reset();
      // Refresh list
      fetch('http://localhost:3000/api/archives')
        .then(res => res.json())
        .then(setArchives);
    } else {
      alert('Upload failed.');
    }
  };

  // Handle search/filter
  const filtered = archives.filter(a =>
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.tags && a.tags.toLowerCase().includes(search.toLowerCase())))
    && (!typeFilter || a.type === typeFilter)
  );

  // Handle delete (admin only)
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this archive item?')) return;
    const res = await fetch(`http://localhost:3000/api/archives/${id}`, { method: 'DELETE' });
    if (res.ok) setArchives(archives.filter(a => a.id !== id));
    else alert('Delete failed.');
  };

  // Render preview modal
  const renderPreview = (item) => {
    const url = `http://localhost:3000${item.file_url}`;
    if (item.type === 'Image') {
      return <img src={url} alt={item.title} style={{ maxWidth: '100%', maxHeight: 400 }} />;
    }
    if (item.type === 'Document') {
      return (
        <iframe
          src={url}
          width="100%"
          height="600px"
          title={item.title}
          style={{ border: 'none' }}
        />
      );
    }
    if (item.type === 'Audio') {
      return <audio controls src={url} style={{ width: '100%' }} />;
    }
    if (item.type === 'Video') {
      return <video controls src={url} style={{ width: '100%', maxHeight: 400 }} />;
    }
    return <a href={url} target="_blank" rel="noopener noreferrer">Open File</a>;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Digital Archives</h1>
      {/* Upload Form (admin only) */}
      <form id="archive-upload-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-10 space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input type="text" name="title" onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea name="description" onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Date</label>
            <input type="date" name="date" onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium mb-1">Type</label>
            <select name="type" onChange={handleChange} className="w-full border rounded px-3 py-2">
              {FILE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Tags</label>
            <input type="text" name="tags" onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g. report, artifact, 2023" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">File</label>
          <input type="file" name="file" onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white text-sm" required />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">Upload</button>
      </form>

      {/* Search/Filter */}
      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Search by title or tags..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-3 py-2 w-64" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Types</option>
          {FILE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Archive List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="mb-2 cursor-pointer" onClick={() => setPreview(item)}>
              {item.type === 'Image' ? (
                <img src={`http://localhost:3000${item.file_url}`} alt={item.title} className="w-full h-40 object-cover rounded" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded text-4xl">
                  {item.type === 'Document' && <span>📄</span>}
                  {item.type === 'Audio' && <span>🎵</span>}
                  {item.type === 'Video' && <span>🎬</span>}
                  {item.type === 'Other' && <span>📁</span>}
                </div>
              )}
            </div>
            <div className="font-semibold text-lg">{item.title}</div>
            <div className="text-gray-600 text-sm mb-1">{item.type} | {formatDate(item.date)}</div>
            <div className="text-gray-500 text-xs mb-2">{item.tags}</div>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => setPreview(item)} className="text-blue-600 hover:underline">Preview</button>
              <a href={`http://localhost:3000${item.file_url}`} download className="text-green-600 hover:underline">Download</a>
              {/* Admin only: */}
              <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setPreview(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">{preview.title}</h2>
            <div className="mb-4">{renderPreview(preview)}</div>
            <div className="mb-2"><strong>Description:</strong> {preview.description}</div>
            <div className="mb-2"><strong>Date:</strong> {formatDate(preview.date)}</div>
            <div className="mb-2"><strong>Type:</strong> {preview.type}</div>
            <div className="mb-2"><strong>Tags:</strong> {preview.tags}</div>
            <a href={`http://localhost:3000${preview.file_url}`} download className="text-green-600 hover:underline">Download</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
