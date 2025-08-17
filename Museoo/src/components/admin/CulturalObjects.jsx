import React, { useState, useEffect } from "react";
import axios from "axios";

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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const fetchObjects = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/cultural-objects');
      setObjects(response.data);
    } catch (err) {
      console.error('Error fetching cultural objects:', err);
      setObjects([]);
    } finally {
      setLoading(false);
    }
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
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      alert("Please fill all required fields (Name, Description, Category).");
      return;
    }

    setSubmitting(true);
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
      
      const response = await axios({
        method,
        url,
        data: formData,
      });
      
      if (response.data.success) {
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
    } finally {
      setSubmitting(false);
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
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cultural object?')) {
      try {
        const response = await axios.delete(`http://localhost:3000/api/cultural-objects/${id}`);
        
        if (response.status === 200) {
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

  const getConditionBadge = (condition) => {
    const badges = {
      'excellent': 'bg-green-100 text-green-800 border border-green-200',
      'good': 'bg-blue-100 text-blue-800 border border-blue-200',
      'fair': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'poor': 'bg-red-100 text-red-800 border border-red-200',
      'under_restoration': 'bg-orange-100 text-orange-800 border border-orange-200'
    };
    return badges[condition] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading cultural objects...
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
              <i className="fa-solid fa-landmark mr-3"></i>
              Cultural Objects
            </h1>
            <p className="text-gray-600">Manage museum artifacts and cultural items</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#AB8841] text-white px-6 py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add Object"}
          </button>
        </div>
      </div>

      {/* Add/Edit Cultural Object Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
            <i className="fa-solid fa-plus-circle mr-3"></i>
            {editingObject ? 'Edit Cultural Object' : 'Add New Cultural Object'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter object name"
                  required
                />
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
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="3"
                placeholder="Enter detailed description"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Period
                </label>
                <input
                  type="text"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Renaissance, Ancient Rome"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Italy, Egypt"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Marble, Oil on Canvas"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={form.dimensions}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., 50cm x 30cm x 20cm"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Condition Status
                </label>
                <select
                  name="condition_status"
                  value={form.condition_status}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="under_restoration">Under Restoration</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  name="acquisition_date"
                  value={form.acquisition_date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Acquisition Method
                </label>
                <select
                  name="acquisition_method"
                  value={form.acquisition_method}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Current Location
                </label>
                <input
                  type="text"
                  name="current_location"
                  value={form.current_location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., Gallery A, Storage Room 3"
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Estimated Value ($)
                </label>
                <input
                  type="number"
                  name="estimated_value"
                  value={form.estimated_value}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="e.g., 50000"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Conservation Notes
              </label>
              <textarea
                name="conservation_notes"
                value={form.conservation_notes}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="2"
                placeholder="Any conservation or restoration notes..."
              />
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Exhibition History
              </label>
              <textarea
                name="exhibition_history"
                value={form.exhibition_history}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="2"
                placeholder="Previous exhibitions where this object was displayed..."
              />
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Images (optional, you can select multiple)
              </label>
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white text-sm"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save mr-2"></i>
                    {editingObject ? 'Update Object' : 'Add Object'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-landmark text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Objects</p>
              <p className="text-2xl font-bold text-blue-600">{objects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-check text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Excellent Condition</p>
              <p className="text-2xl font-bold text-green-600">
                {objects.filter(obj => obj.condition_status === 'excellent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-tools text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Under Restoration</p>
              <p className="text-2xl font-bold text-yellow-600">
                {objects.filter(obj => obj.condition_status === 'under_restoration').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-palette text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paintings</p>
              <p className="text-2xl font-bold text-purple-600">
                {objects.filter(obj => obj.category === 'Painting').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#2e2b41] font-semibold mb-2">
              <i className="fa-solid fa-search mr-2"></i>
              Search Objects
            </label>
            <input
              type="text"
              placeholder="Search by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            />
          </div>
          <div>
            <label className="block text-[#2e2b41] font-semibold mb-2">
              <i className="fa-solid fa-filter mr-2"></i>
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
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
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
          <h3 className="text-xl font-bold text-white">
            <i className="fa-solid fa-list mr-2"></i>
            Cultural Objects ({filteredObjects.length})
          </h3>
        </div>
        
        {filteredObjects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fa-solid fa-landmark text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg">No cultural objects found</p>
            <p className="text-sm">Add your first cultural object to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredObjects.map((object) => (
                  <tr key={object.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {object.images && object.images.length > 0 ? (
                        <img 
                          src={`http://localhost:3000${object.images[0]}`} 
                          alt={object.name} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-400"></i>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#2e2b41]">{object.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {object.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConditionBadge(object.condition_status)}`}>
                        {object.condition_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {object.current_location || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalObject(object)}
                          className="text-[#AB8841] hover:text-[#8B6B21] font-semibold"
                        >
                          <i className="fa-solid fa-eye mr-1"></i>
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(object)}
                          className="text-green-600 hover:text-green-800 font-semibold"
                        >
                          <i className="fa-solid fa-edit mr-1"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(object.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          <i className="fa-solid fa-trash mr-1"></i>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl" 
              onClick={() => setModalObject(null)}
            >
              <i className="fa-solid fa-times"></i>
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-[#2e2b41]">{modalObject.name}</h2>
            
            {modalObject.images && modalObject.images.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-[#2e2b41]">Images</h3>
                <div className="flex gap-2 flex-wrap">
                  {modalObject.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={`http://localhost:3000${img}`} 
                      alt={`${modalObject.name} ${idx + 1}`} 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 text-sm">
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