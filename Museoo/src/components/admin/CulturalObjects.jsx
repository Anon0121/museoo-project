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

const CATEGORY_OPTIONS = [
  "Artifact",
  "Painting",
  "Sculpture",
  "Manuscript",
  "Jewelry",
  "Textile",
  "Tool",
  "Weapon",
  "Other"
];

const CulturalObjects = () => {
  const [objects, setObjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    period: "",
    origin: "",
    material: "",
    dimensions: "",
    condition_status: "good",
    acquisition_date: "",
    acquisition_method: "donation",
    current_location: "",
    estimated_value: "",
    conservation_notes: "",
    exhibition_history: "",
    images: []
  });
  const [modalObject, setModalObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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

  const fetchObjects = () => {
    fetch('http://localhost:3000/api/cultural-objects')
      .then(res => res.json())
      .then(data => {
        setObjects(data);
      })
      .catch(err => {
        console.error('Error fetching cultural objects:', err);
        setObjects([]);
      });
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "",
      period: "",
      origin: "",
      material: "",
      dimensions: "",
      condition_status: "good",
      acquisition_date: "",
      acquisition_method: "donation",
      current_location: "",
      estimated_value: "",
      conservation_notes: "",
      exhibition_history: "",
      images: []
    });
    setEditingObject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      alert("Please fill all required fields (Name, Description, Category).");
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'images') {
        for (const file of form.images) {
          formData.append('images', file);
        }
      } else {
        formData.append(key, form[key]);
      }
    });

    try {
      const url = editingObject 
        ? `http://localhost:3000/api/cultural-objects/${editingObject.id}`
        : 'http://localhost:3000/api/cultural-objects';
      
      const method = editingObject ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(editingObject ? 'Cultural object updated successfully!' : 'Cultural object added successfully!');
        resetForm();
        e.target.reset();
        fetchObjects();
      } else {
        alert('Failed to save cultural object.');
      }
    } catch (err) {
      console.error('Error saving cultural object:', err);
      alert('Error saving cultural object.');
    }
  };

  const handleEdit = (object) => {
    setEditingObject(object);
    setForm({
      name: object.name,
      description: object.description,
      category: object.category,
      period: object.period || "",
      origin: object.origin || "",
      material: object.material || "",
      dimensions: object.dimensions || "",
      condition_status: object.condition_status,
      acquisition_date: object.acquisition_date || "",
      acquisition_method: object.acquisition_method,
      current_location: object.current_location || "",
      estimated_value: object.estimated_value || "",
      conservation_notes: object.conservation_notes || "",
      exhibition_history: object.exhibition_history || "",
      images: []
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cultural object?')) {
      try {
        const res = await fetch(`http://localhost:3000/api/cultural-objects/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          alert('Cultural object deleted successfully!');
          fetchObjects();
        } else {
          alert('Failed to delete cultural object.');
        }
      } catch (err) {
        console.error('Error deleting cultural object:', err);
        alert('Error deleting cultural object.');
      }
    }
  };

  // Filter objects based on search term and category
  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || obj.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(objects.map(obj => obj.category))];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Cultural Objects</h1>

      {/* Add/Edit Cultural Object Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 mb-10 space-y-4"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingObject ? 'Edit Cultural Object' : 'Add New Cultural Object'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Period</label>
            <input
              type="text"
              name="period"
              value={form.period}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Renaissance, Ancient Rome"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Origin</label>
            <input
              type="text"
              name="origin"
              value={form.origin}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Italy, Egypt"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Material</label>
            <input
              type="text"
              name="material"
              value={form.material}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Marble, Oil on Canvas"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Dimensions</label>
            <input
              type="text"
              name="dimensions"
              value={form.dimensions}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 50cm x 30cm x 20cm"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Condition Status</label>
            <select
              name="condition_status"
              value={form.condition_status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="under_restoration">Under Restoration</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Acquisition Date</label>
            <input
              type="date"
              name="acquisition_date"
              value={form.acquisition_date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Acquisition Method</label>
            <select
              name="acquisition_method"
              value={form.acquisition_method}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="purchase">Purchase</option>
              <option value="donation">Donation</option>
              <option value="loan">Loan</option>
              <option value="excavation">Excavation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Current Location</label>
            <input
              type="text"
              name="current_location"
              value={form.current_location}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Gallery A, Storage Room 3"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Estimated Value ($)</label>
            <input
              type="number"
              name="estimated_value"
              value={form.estimated_value}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 50000"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Conservation Notes</label>
          <textarea
            name="conservation_notes"
            value={form.conservation_notes}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Any conservation or restoration notes..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Exhibition History</label>
          <textarea
            name="exhibition_history"
            value={form.exhibition_history}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Previous exhibitions where this object was displayed..."
          />
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

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            {editingObject ? 'Update Object' : 'Add Object'}
          </button>
          {editingObject && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Search and Filter - moved above the table */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Search Objects</label>
            <input
              type="text"
              placeholder="Search by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cultural Objects List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Cultural Objects ({filteredObjects.length})</h2>
        </div>
        
        {filteredObjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No cultural objects found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-medium">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjects.map((object) => (
                  <tr key={object.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {object.images && object.images.length > 0 ? (
                        <img 
                          src={`http://localhost:3000${object.images[0]}`} 
                          alt={object.name} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-400"></i>
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{object.name}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {object.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        object.condition_status === 'excellent' ? 'bg-green-100 text-green-800' :
                        object.condition_status === 'good' ? 'bg-blue-100 text-blue-800' :
                        object.condition_status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        object.condition_status === 'poor' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {object.condition_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{object.current_location || 'Not specified'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalObject(object)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(object)}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(object.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing details */}
      {modalObject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl" 
              onClick={() => setModalObject(null)}
            >
              &times;
            </button>
            
            <h2 className="text-2xl font-bold mb-4">{modalObject.name}</h2>
            
            {modalObject.images && modalObject.images.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Images</h3>
                <div className="flex gap-2 flex-wrap">
                  {modalObject.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={`http://localhost:3000${img}`} 
                      alt={`${modalObject.name} ${idx + 1}`} 
                      className="w-32 h-32 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div><strong>Category:</strong> {modalObject.category}</div>
              <div><strong>Period:</strong> {modalObject.period || 'Not specified'}</div>
              <div><strong>Origin:</strong> {modalObject.origin || 'Not specified'}</div>
              <div><strong>Material:</strong> {modalObject.material || 'Not specified'}</div>
              <div><strong>Dimensions:</strong> {modalObject.dimensions || 'Not specified'}</div>
              <div><strong>Condition:</strong> {modalObject.condition_status.replace('_', ' ')}</div>
              <div><strong>Acquisition Date:</strong> {formatDate(modalObject.acquisition_date)}</div>
              <div><strong>Acquisition Method:</strong> {modalObject.acquisition_method}</div>
              <div><strong>Current Location:</strong> {modalObject.current_location || 'Not specified'}</div>
              <div><strong>Estimated Value:</strong> {modalObject.estimated_value ? `$${modalObject.estimated_value}` : 'Not specified'}</div>
            </div>

            <div className="mt-4">
              <strong>Description:</strong>
              <p className="mt-1 text-gray-700">{modalObject.description}</p>
            </div>

            {modalObject.conservation_notes && (
              <div className="mt-4">
                <strong>Conservation Notes:</strong>
                <p className="mt-1 text-gray-700">{modalObject.conservation_notes}</p>
              </div>
            )}

            {modalObject.exhibition_history && (
              <div className="mt-4">
                <strong>Exhibition History:</strong>
                <p className="mt-1 text-gray-700">{modalObject.exhibition_history}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CulturalObjects; 