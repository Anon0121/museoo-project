import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import api from '../../config/api';

const PromotionalManagement = () => {
  const [promotionalItems, setPromotionalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: null,
    ctaText: '',
    ctaLink: '',
    badge: '',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchPromotionalItems();
  }, []);

  const fetchPromotionalItems = async () => {
    try {
      const response = await api.get('/api/promotional');
      setPromotionalItems(response.data);
    } catch (error) {
      console.error('Error fetching promotional items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingItem) {
        await api.put(`/api/promotional/${editingItem.id}`, formDataToSend);
      } else {
        await api.post('/api/promotional', formDataToSend);
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error saving promotional item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: null,
      ctaText: item.ctaText,
      ctaLink: item.ctaLink,
      badge: item.badge,
      isActive: item.isActive,
      order: item.order
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotional item?')) {
      try {
        await api.delete(`/api/promotional/${id}`);
        fetchPromotionalItems();
      } catch (error) {
        console.error('Error deleting promotional item:', error);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      console.log('Toggling promotional item:', id, 'from', currentStatus, 'to', !currentStatus);
      const response = await api.patch(`/api/promotional/${id}`, { isActive: !currentStatus });
      console.log('Toggle response:', response.data);
      fetchPromotionalItems();
    } catch (error) {
      console.error('Error toggling promotional item status:', error);
      alert('Failed to toggle status. Please check the console for details.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: null,
      ctaText: '',
      ctaLink: '',
      badge: '',
      isActive: true,
      order: 0
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Promotional Management</h1>
          <p className="text-gray-600">Manage promotional content for the highlights section</p>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Promotional Item
          </button>
        </div>

        {/* Promotional Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B21]"></div>
              <span className="text-gray-600 font-medium">Loading promotional items...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionalItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {item.image ? (
                    <img
                      src={`${api.defaults.baseURL}${item.image}`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8B6B21]/20 to-[#D4AF37]/20 flex items-center justify-center">
                      <svg className="w-16 h-16 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-[#8B6B21] text-white rounded-full text-xs font-semibold">
                      Order: {item.order}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-[#8B6B21]/20 text-[#8B6B21] rounded-full text-xs font-semibold">
                      {item.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.subtitle}
                  </p>
                  
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Tag: {item.ctaText || 'No tag'}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isActive 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={item.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <FontAwesomeIcon icon={item.isActive ? faEyeSlash : faEye} className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && promotionalItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Promotional Items</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first promotional item.</p>
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add First Item
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem ? 'Edit Promotional Item' : 'Add Promotional Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                    placeholder="Enter promotional title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Badge *
                  </label>
                  <input
                    type="text"
                    name="badge"
                    value={formData.badge}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                    placeholder="e.g., Featured, New, Popular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle *
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                  placeholder="Enter subtitle"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all resize-none"
                  placeholder="Enter detailed description"
                />
              </div>

                             <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Promotional Tag
                 </label>
                 <input
                   type="text"
                   name="ctaText"
                   value={formData.ctaText}
                   onChange={handleInputChange}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                   placeholder="e.g., Now Showing, Coming Soon, Special Event"
                 />
                 <p className="text-sm text-gray-500 mt-1">This will appear as a decorative tag on the promotional item</p>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B6B21] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#8B6B21] border-gray-300 rounded focus:ring-[#8B6B21]"
                />
                <label className="ml-2 text-sm font-semibold text-gray-700">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionalManagement;
