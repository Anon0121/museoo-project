import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { canView, canEdit, canAdmin, getAccessLevel } from '../../utils/permissions';

const FILE_TYPES = [
  { label: 'Document', value: 'Document', icon: 'fa-file-alt' },
  { label: 'Image', value: 'Image', icon: 'fa-image' },
  { label: 'Audio', value: 'Audio', icon: 'fa-music' },
  { label: 'Video', value: 'Video', icon: 'fa-video' },
  { label: 'Other', value: 'Other', icon: 'fa-file' },
];

const ARCHIVE_CATEGORIES = [
  { label: 'History of Cdeo', value: 'History of Cdeo' },
  { label: 'Local Heroes', value: 'Local Heroes' },
  { label: 'History of Baragnays', value: 'History of Baragnays' },
  { label: 'Fathers of City Charter', value: 'Fathers of City Charter' },
  { label: 'Mayor Of Cagayan De oro City', value: 'Mayor Of Cagayan De oro City' },
  { label: 'Other', value: 'Other' },
];

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const Archive = ({ userPermissions }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Document',
    category: 'Other',
    tags: '',
    file: null,
    is_visible: true,
  });
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch archives from backend
  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/archives/admin');
      setArchives(response.data);
    } catch (error) {
      console.error('Error fetching archives:', error);
    } finally {
      setLoading(false);
    }
  };

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

    setUploading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'file') formData.append('file', v);
        else formData.append(k, v);
      });

      const response = await axios.post('http://localhost:3000/api/archives', formData);
      if (response.status === 200) {
        setForm({ title: '', description: '', date: '', type: 'Document', category: 'Other', tags: '', file: null, is_visible: true });
        document.getElementById('archive-upload-form').reset();
        setShowForm(false);
        fetchArchives();
        alert('Archive uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed.');
    } finally {
      setUploading(false);
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
    try {
      const response = await axios.delete(`http://localhost:3000/api/archives/${id}`);
      if (response.status === 200) {
        setArchives(archives.filter(a => a.id !== id));
        alert('Archive deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed.');
    }
  };

  // Handle visibility toggle (admin only)
  const handleVisibilityToggle = async (id, currentVisibility) => {
    try {
      const response = await axios.patch(`http://localhost:3000/api/archives/${id}/visibility`, {
        is_visible: !currentVisibility
      });
      if (response.status === 200) {
        setArchives(archives.map(a => 
          a.id === id ? { ...a, is_visible: !currentVisibility } : a
        ));
        alert(`Archive ${!currentVisibility ? 'shown' : 'hidden'} successfully!`);
      }
    } catch (error) {
      console.error('Visibility toggle error:', error);
      alert('Visibility toggle failed.');
    }
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

  const getTypeIcon = (type) => {
    const fileType = FILE_TYPES.find(t => t.value === type);
    return fileType ? fileType.icon : 'fa-file';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading archives...
        </div>
      </div>
    );
  }

  // Check permissions
  const canViewArchive = canView(userPermissions, 'archive');
  const canEditArchive = canEdit(userPermissions, 'archive');
  const canAdminArchive = canAdmin(userPermissions, 'archive');
  const accessLevel = getAccessLevel(userPermissions, 'archive');

  console.log("🔍 Archive permissions:", { canViewArchive, canEditArchive, canAdminArchive, accessLevel });

  // If no view permission, show access denied
  if (!canViewArchive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-ban text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view the Archive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-box-archive mr-3"></i>
              Digital Archives
            </h1>
            <p className="text-gray-600">
              Manage and organize digital museum resources
              {accessLevel !== 'none' && (
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  accessLevel === 'view' ? 'bg-blue-100 text-blue-700' :
                  accessLevel === 'edit' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {accessLevel.toUpperCase()} ACCESS
                </span>
              )}
            </p>
          </div>
          {canEditArchive && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#AB8841] text-white px-6 py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              {showForm ? "Cancel" : "Upload Archive"}
            </button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showForm && canEditArchive && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
            <i className="fa-solid fa-upload mr-3"></i>
            Upload New Archive
          </h3>
          <form id="archive-upload-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Title *
                </label>
                <input 
                  type="text" 
                  name="title" 
                  value={form.title}
                  onChange={handleChange} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]" 
                  placeholder="Enter archive title"
                  required 
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Type *
                </label>
                <select 
                  name="type" 
                  value={form.type}
                  onChange={handleChange} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                >
                  {FILE_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Category *
                </label>
                <select 
                  name="category" 
                  value={form.category}
                  onChange={handleChange} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                >
                  {ARCHIVE_CATEGORIES.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Description
              </label>
              <textarea 
                name="description" 
                value={form.description}
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="3"
                placeholder="Enter archive description"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Date
                </label>
                <input 
                  type="date" 
                  name="date" 
                  value={form.date}
                  onChange={handleChange} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]" 
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Tags
                </label>
                <input 
                  type="text" 
                  name="tags" 
                  value={form.tags}
                  onChange={handleChange} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]" 
                  placeholder="e.g. report, artifact, 2023" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                File *
              </label>
              <input 
                type="file" 
                name="file" 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white text-sm" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Visibility
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="is_visible" 
                    value="true"
                    checked={form.is_visible === true}
                    onChange={(e) => setForm(prev => ({ ...prev, is_visible: e.target.value === 'true' }))}
                    className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                  />
                  <span className="text-sm text-gray-700">
                    <i className="fa-solid fa-eye mr-1 text-green-600"></i>
                    Visible to visitors
                  </span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="is_visible" 
                    value="false"
                    checked={form.is_visible === false}
                    onChange={(e) => setForm(prev => ({ ...prev, is_visible: e.target.value === 'true' }))}
                    className="mr-2 text-[#AB8841] focus:ring-[#AB8841]"
                  />
                  <span className="text-sm text-gray-700">
                    <i className="fa-solid fa-eye-slash mr-1 text-gray-600"></i>
                    Hidden from visitors
                  </span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="submit" 
                disabled={uploading}
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-upload mr-2"></i>
                    Upload Archive
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search/Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-[#2e2b41] font-semibold mb-2">
              <i className="fa-solid fa-search mr-2"></i>
              Search Archives
            </label>
            <input 
              type="text" 
              placeholder="Search by title or tags..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]" 
            />
          </div>
          <div className="md:w-48">
            <label className="block text-[#2e2b41] font-semibold mb-2">
              <i className="fa-solid fa-filter mr-2"></i>
              Filter by Type
            </label>
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            >
              <option value="">All Types</option>
              {FILE_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {FILE_TYPES.map(type => (
          <div key={type.value} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <i className={`fa-solid ${type.icon} text-blue-600 text-xl`}></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">{type.label}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {archives.filter(a => a.type === type.value).length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Archive List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
          <h3 className="text-xl font-bold text-white">
            <i className="fa-solid fa-list mr-2"></i>
            All Archives ({filtered.length})
          </h3>
        </div>
        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="fa-solid fa-box-archive text-4xl mb-4 text-gray-300"></i>
              <p className="text-lg">No archives found</p>
              <p className="text-sm">Upload your first archive to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="mb-4 cursor-pointer" onClick={() => setPreview(item)}>
                    {item.type === 'Image' ? (
                      <img 
                        src={`http://localhost:3000${item.file_url}`} 
                        alt={item.title} 
                        className="w-full h-40 object-cover rounded-lg" 
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <i className={`fa-solid ${getTypeIcon(item.type)} text-4xl text-gray-400`}></i>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg text-[#2e2b41]">{item.title}</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <i className={`fa-solid ${getTypeIcon(item.type)} mr-2`}></i>
                      {item.type} | {formatDate(item.date)}
                    </div>
                    {item.category && (
                      <div className="text-sm text-[#AB8841] font-medium">
                        <i className="fa-solid fa-folder mr-1"></i>
                        {item.category}
                      </div>
                    )}
                    {item.tags && (
                      <div className="text-gray-500 text-xs">
                        <i className="fa-solid fa-tags mr-1"></i>
                        {item.tags}
                      </div>
                    )}
                    <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                      item.is_visible 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <i className={`fa-solid ${item.is_visible ? 'fa-eye' : 'fa-eye-slash'} mr-1`}></i>
                      {item.is_visible ? 'Visible' : 'Hidden'}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setPreview(item)} 
                        className="text-[#AB8841] hover:text-[#8B6B21] font-semibold text-sm"
                      >
                        <i className="fa-solid fa-eye mr-1"></i>
                        Preview
                      </button>
                      {canEditArchive && (
                        <a 
                          href={`http://localhost:3000${item.file_url}`} 
                          download 
                          className="text-green-600 hover:text-green-800 font-semibold text-sm"
                        >
                          <i className="fa-solid fa-download mr-1"></i>
                          Download
                        </a>
                      )}
                      {canEditArchive && (
                        <button 
                          onClick={() => handleVisibilityToggle(item.id, item.is_visible)} 
                          className={`font-semibold text-sm ${
                            item.is_visible 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          <i className={`fa-solid ${item.is_visible ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                          {item.is_visible ? 'Hide' : 'Show'}
                        </button>
                      )}
                      {canAdminArchive && (
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          <i className="fa-solid fa-trash mr-1"></i>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl" 
              onClick={() => setPreview(null)}
            >
              <i className="fa-solid fa-times"></i>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-[#2e2b41]">{preview.title}</h2>
            <div className="mb-6">{renderPreview(preview)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Description:</strong> {preview.description || 'No description'}</div>
              <div><strong>Date:</strong> {formatDate(preview.date)}</div>
              <div><strong>Type:</strong> {preview.type}</div>
              <div><strong>Category:</strong> {preview.category || 'Other'}</div>
              <div><strong>Tags:</strong> {preview.tags || 'No tags'}</div>
            </div>
            <div className="mt-6">
              <a 
                href={`http://localhost:3000${preview.file_url}`} 
                download 
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                <i className="fa-solid fa-download mr-2"></i>
                Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
